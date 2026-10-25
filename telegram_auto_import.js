require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

async function runSmartImporter() {
    console.log("🚀 شروع پردازش فوق‌هوشمند (Ultra-Fuzzy) دیتای تلگرام و اکسل...");
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL, 
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (!fs.existsSync('result.json')) return console.log("❌ فایل result.json یافت نشد.");
    const tgData = JSON.parse(fs.readFileSync('result.json', 'utf8'));
    const productsMap = [];
    let currentProduct = null;

    for (const msg of (tgData.messages || [])) {
        if (msg.type !== 'message') continue;
        
        let textContent = Array.isArray(msg.text) 
            ? msg.text.map(t => typeof t === 'string' ? t : t.text).join('') 
            : (msg.text || '');

        if (textContent.length > 20) {
            currentProduct = { description: textContent, photos: msg.photo ? [msg.photo] : [], date: msg.date_unixtime };
            productsMap.push(currentProduct);
        } else if (msg.photo && currentProduct && Math.abs(msg.date_unixtime - currentProduct.date) < 120) {
            currentProduct.photos.push(msg.photo);
        }
    }
    console.log(`✅ دیتای تلگرام اسکن شد. ${productsMap.length} گروه پیدا شد.`);

    const excelFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.xlsx') && !f.startsWith('~'));
    if (excelFiles.length === 0) return console.log("❌ هیچ فایل اکسلی یافت نشد.");

    let successCount = 0;

    for (const file of excelFiles) {
        console.log(`\n📂 در حال تحلیل فایل: ${file}`);
        const extractedCategory = file.split('-')[0].split('_')[0].trim();
        
        let workbook;
        try {
            workbook = xlsx.readFile(file);
        } catch (e) {
            console.log(`❌ فایل ${file} ساختار خراب دارد. لطفاً آن را در Excel باز کرده و مجدداً Save As کنید.`);
            continue;
        }

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        let headerRowIndex = -1;
        let colMap = { name: -1, buyPrice: -1, stock: -1 };

        // جستجوی بسیار منعطف تا 100 ردیف پایین برای پیدا کردن هدرها
        for (let i = 0; i < Math.min(100, rawData.length); i++) {
            if (!rawData[i]) continue;
            const rowStr = rawData[i].map(String).join(' ').toLowerCase();
            
            if ((rowStr.includes('نام') || rowStr.includes('کالا') || rowStr.includes('محصول')) &&
                (rowStr.includes('قیمت') || rowStr.includes('دراپ') || rowStr.includes('خرید'))) {
                
                headerRowIndex = i;
                const headers = rawData[i].map(h => String(h || '').toLowerCase().trim());
                
                colMap.name = headers.findIndex(h => h.includes('نام') || h.includes('کالا') || h.includes('محصول'));
                colMap.buyPrice = headers.findIndex(h => h.includes('دراپ') || h.includes('قیمت') || h.includes('خرید'));
                colMap.stock = headers.findIndex(h => h.includes('موجود'));
                break;
            }
        }

        if (headerRowIndex === -1 || colMap.name === -1 || colMap.buyPrice === -1) {
            console.log(`⚠️ ستون‌های اصلی پیدا نشد. پرش از این فایل.`);
            continue;
        }

        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || !row[colMap.name]) continue;

            const productName = String(row[colMap.name]).trim();
            const buyPrice = Number(String(row[colMap.buyPrice] || '0').replace(/\D/g, ''));
            const stock = colMap.stock !== -1 ? Number(String(row[colMap.stock] || '10').replace(/\D/g, '')) : 10;

            if (buyPrice === 0) continue;

            const matchedTg = productsMap.find(p => p.description.includes(productName));

            if (matchedTg && matchedTg.photos.length > 0) {
                console.log(`🔗 آپلود و ثبت: ${productName.slice(0, 30)}...`);
                
                const uploadedUrls = [];
                for (const photoPath of matchedTg.photos) {
                    if (fs.existsSync(photoPath)) {
                        const fileBuffer = fs.readFileSync(photoPath);
                        const ext = photoPath.split('.').pop();
                        const cloudPath = `uploads/bulk_${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`;
                        
                        try {
                            await supabase.storage.from('products').upload(cloudPath, fileBuffer, { contentType: 'image/jpeg' });
                            const { data } = supabase.storage.from('products').getPublicUrl(cloudPath);
                            uploadedUrls.push(data.publicUrl);
                        } catch(e) {
                            console.log(`خطا در آپلود عکس برای ${productName}`);
                        }
                    }
                }

                if (uploadedUrls.length > 0) {
                    const priceWithProfit = buyPrice * 1.10;
                    const finalPrice = Math.ceil((priceWithProfit * 1.10) / 1000) * 1000;

                    await supabase.from('products').insert([{
                        title: productName,
                        category: extractedCategory,
                        price: finalPrice,
                        stock: stock,
                        is_available: stock > 0,
                        description: matchedTg.description,
                        image_url: uploadedUrls[0],
                        images: uploadedUrls,
                        created_at: new Date().toISOString()
                    }]);
                    successCount++;
                }
            }
        }
    }

    console.log(`\n🎉 ماموریت انجام شد! ${successCount} محصول با عکس، قیمت محاسبه‌شده و دسته‌بندی وارد سایت شد.`);
}

runSmartImporter();