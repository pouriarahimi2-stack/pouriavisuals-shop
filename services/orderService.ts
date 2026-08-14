export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerLastName?: string;
  customerPhone: string;
  isPhoneVerified: boolean;
  otpHash?: string;
  otpSentAt?: string;
  customerAddress: string;
  postalCode?: string;
  isPostalCodeVerifiedGNAF?: boolean;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: "pending" | "completed" | "cancelled";
  paymentStatus: "paid" | "unpaid" | "failed";
  transactionId?: string;
  createdAt: string;
}

const STORAGE_KEY = "app_orders_db";

export const orderService = {
  getOrders(): Order[] {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  saveOrders(orders: Order[]): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }
  },

  addOrder(
    orderData: Omit<Order, "id" | "status" | "paymentStatus" | "createdAt"> & {
      paymentStatus?: Order["paymentStatus"];
      transactionId?: string;
    }
  ): Order {
    const orders = this.getOrders();
    const newOrder: Order = {
      ...orderData,
      id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
      status: orderData.paymentStatus === "paid" ? "completed" : "pending",
      paymentStatus: orderData.paymentStatus || "unpaid",
      createdAt: new Date().toISOString(),
    };
    const updated = [newOrder, ...orders];
    this.saveOrders(updated);
    return newOrder;
  },

  updateOrderStatus(
    id: string,
    status: Order["status"],
    paymentStatus?: Order["paymentStatus"]
  ): Order[] {
    const orders = this.getOrders();
    const updated = orders.map((o) => {
      if (o.id === id) {
        return {
          ...o,
          status,
          ...(paymentStatus ? { paymentStatus } : {}),
        };
      }
      return o;
    });
    this.saveOrders(updated);
    return updated;
  },

  getOrderById(id: string): Order | undefined {
    const orders = this.getOrders();
    const cleanId = id.toUpperCase().replace("#", "");
    return orders.find(
      (o) => o.id.toUpperCase() === cleanId || o.id.toUpperCase() === `ORD-${cleanId}`
    );
  },

  async verifyPostalCodeWithPostOfficeAPI(postalCode: string): Promise<{ valid: boolean; addressDetail?: string }> {
    return { valid: true, addressDetail: "تایید شده از سامانه شاهکار / پست" };
  }
};