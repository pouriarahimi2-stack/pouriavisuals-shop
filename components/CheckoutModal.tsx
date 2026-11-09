"use client";
import SecurityCaptchaBox from "@/components/SecurityCaptchaBox";
// File Path: components/CheckoutModal.tsx

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { couponService, Coupon } from "@/services/couponService";
import { soundEngine } from "@/lib/soundEngine";

const MODAL_DRAFT_KEY = "axon_checkout_modal_draft_v2026";

const IRAN_PROVINCES_MAP: Record<string, string[]> = {
  "ØªÙ‡Ø±Ø§Ù†": ["ØªÙ‡Ø±Ø§Ù†", "Ø´Ù‡Ø±ÛŒØ§Ø±", "Ø§Ø³Ù„Ø§Ù…Ø´Ù‡Ø±", "Ù‚Ø¯Ø³", "Ù…Ù„Ø§Ø±Ø¯", "Ù¾Ø§Ú©Ø¯Ø´Øª", "Ø±ÛŒ", "ÙˆØ±Ø§Ù…ÛŒÙ†", "Ù¾Ø±Ø¯ÛŒØ³", "Ø¯Ù…Ø§ÙˆÙ†Ø¯"],
  "ÙØ§Ø±Ø³": ["Ø´ÛŒØ±Ø§Ø²", "Ù…Ø±ÙˆØ¯Ø´Øª", "Ø¬Ù‡Ø±Ù…", "ÙØ³Ø§", "Ú©Ø§Ø²Ø±ÙˆÙ†", "Ø¯Ø§Ø±Ø§Ø¨", "Ù„Ø§Ø±", "Ø¢Ø¨Ø§Ø¯Ù‡", "ØµØ¯Ø±Ø§"],
  "Ø§ØµÙÙ‡Ø§Ù†": ["Ø§ØµÙÙ‡Ø§Ù†", "Ú©Ø§Ø´Ø§Ù†", "Ø®Ù…ÛŒÙ†ÛŒâ€ŒØ´Ù‡Ø±", "Ù†Ø¬Ùâ€ŒØ¢Ø¨Ø§Ø¯", "Ø´Ø§Ù‡ÛŒÙ†â€Œâ€ŒØ´Ù‡Ø±", "Ø´Ù‡Ø±Ø¶Ø§", "ÙÙˆÙ„Ø§Ø¯Ø´Ù‡Ø±"],
  "Ø®Ø±Ø§Ø³Ø§Ù† Ø±Ø¶ÙˆÛŒ": ["Ù…Ø´Ù‡Ø¯", "Ù†ÛŒØ´Ø§Ø¨ÙˆØ±", "Ø³Ø¨Ø²ÙˆØ§Ø±", "ØªØ±Ø¨Øª Ø­ÛŒØ¯Ø±ÛŒÙ‡", "Ú©Ø§Ø´Ù…Ø±", "Ù‚ÙˆÚ†Ø§Ù†"],
  "Ø¢Ø°Ø±Ø¨Ø§ÛŒØ¬Ø§Ù† Ø´Ø±Ù‚ÛŒ": ["ØªØ¨Ø±ÛŒØ²", "Ù…Ø±Ø§ØºÙ‡", "Ù…Ø±Ù†Ø¯", "Ù…ÛŒØ§Ù†Ù‡", "Ø§Ù‡Ø±", "Ø¨Ù†Ø§Ø¨"],
  "Ù…Ø§Ø²Ù†Ø¯Ø±Ø§Ù†": ["Ø³Ø§Ø±ÛŒ", "Ø¨Ø§Ø¨Ù„", "Ø¢Ù…Ù„", "Ù‚Ø§Ø¦Ù…â€ŒØ´Ù‡Ø±", "Ø¨Ù‡Ø´Ù‡Ø±", "Ú†Ø§Ù„ÙˆØ³", "Ø¨Ø§Ø¨Ù„Ø³Ø±", "ØªÙ†Ú©Ø§Ø¨Ù†", "Ø±Ø§Ù…Ø³Ø±"],
  "Ø§Ù„Ø¨Ø±Ø²": ["Ú©Ø±Ø¬", "ÙØ±Ø¯ÛŒØ³", "Ú©Ù…Ø§Ù„â€ŒØ´Ù‡Ø±", "Ù†Ø¸Ø±Ø¢Ø¨Ø§Ø¯", "Ù…Ø­Ù…Ø¯Ø´Ù‡Ø±", "Ù…Ø§Ù‡Ø¯Ø´Øª", "Ù‡Ø´ØªÚ¯Ø±Ø¯"],
  "Ø®ÙˆØ²Ø³ØªØ§Ù†": ["Ø§Ù‡ÙˆØ§Ø²", "Ø¯Ø²ÙÙˆÙ„", "Ø¢Ø¨Ø§Ø¯Ø§Ù†", "Ø¨Ù†Ø¯Ø± Ù…Ø§Ù‡Ø´Ù‡Ø±", "Ø®Ø±Ù…Ø´Ù‡Ø±", "Ø§Ù†Ø¯ÛŒÙ…Ø´Ú©", "Ø¨Ù‡Ø¨Ù‡Ø§Ù†"],
  "Ú¯ÛŒÙ„Ø§Ù†": ["Ø±Ø´Øª", "Ø¨Ù†Ø¯Ø± Ø§Ù†Ø²Ù„ÛŒ", "Ù„Ø§Ù‡ÛŒØ¬Ø§Ù†", "Ù„Ù†Ú¯Ø±ÙˆØ¯", "ØªØ§Ù„Ø´", "Ø¢Ø³ØªØ§Ø±Ø§", "Ø±ÙˆØ¯Ø³Ø±"],
  "Ú©Ø±Ù…Ø§Ù†": ["Ú©Ø±Ù…Ø§Ù†", "Ø³ÛŒØ±Ø¬Ø§Ù†", "Ø±ÙØ³Ù†Ø¬Ø§Ù†", "Ø¬ÛŒØ±ÙØª", "Ø¨Ù…", "Ø²Ø±Ù†Ø¯"],
  "Ø¢Ø°Ø±Ø¨Ø§ÛŒØ¬Ø§Ù† ØºØ±Ø¨ÛŒ": ["Ø§Ø±ÙˆÙ…ÛŒÙ‡", "Ø®ÙˆÛŒ", "Ø¨ÙˆÚ©Ø§Ù†", "Ù…Ù‡Ø§Ø¨Ø§Ø¯", "Ù…ÛŒØ§Ù†Ø¯ÙˆØ¢Ø¨", "Ø³Ù„Ù…Ø§Ø³"],
  "Ù‡Ø±Ù…Ø²Ú¯Ø§Ù†": ["Ø¨Ù†Ø¯Ø±Ø¹Ø¨Ø§Ø³", "Ù…ÛŒÙ†Ø§Ø¨", "Ù‚Ø´Ù…", "Ú©ÛŒØ´", "Ø¨Ù†Ø¯Ø± Ù„Ù†Ú¯Ù‡"],
  "Ù…Ø±Ú©Ø²ÛŒ": ["Ø§Ø±Ø§Ú©", "Ø³Ø§ÙˆÙ‡", "Ø®Ù…ÛŒÙ†", "Ù…Ø­Ù„Ø§Øª", "Ø¯Ù„ÛŒØ¬Ø§Ù†"],
  "Ù‡Ù…Ø¯Ø§Ù†": ["Ù‡Ù…Ø¯Ø§Ù†", "Ù…Ù„Ø§ÛŒØ±", "Ù†Ù‡Ø§ÙˆÙ†Ø¯", "Ø§Ø³Ø¯Ø¢Ø¨Ø§Ø¯", "ØªÙˆÛŒØ³Ø±Ú©Ø§Ù†"],
  "ÛŒØ²Ø¯": ["ÛŒØ²Ø¯", "Ù…ÛŒØ¨Ø¯", "Ø§Ø±Ø¯Ú©Ø§Ù†", "Ø¨Ø§ÙÙ‚", "Ù…Ù‡Ø±ÛŒØ²"],
  "Ú©Ø±Ù…Ø§Ù†Ø´Ø§Ù‡": ["Ú©Ø±Ù…Ø§Ù†Ø´Ø§Ù‡", "Ø§Ø³Ù„Ø§Ù…â€ŒØ¢Ø¨Ø§Ø¯ ØºØ±Ø¨", "Ø¬ÙˆØ§Ù†Ø±ÙˆØ¯", "Ú©Ù†Ú¯Ø§ÙˆØ±", "Ø³Ø±Ù¾Ù„ Ø°Ù‡Ø§Ø¨"],
  "Ù‚Ø²ÙˆÛŒÙ†": ["Ù‚Ø²ÙˆÛŒÙ†", "Ø§Ù„ÙˆÙ†Ø¯", "ØªØ§Ú©Ø³ØªØ§Ù†", "Ø¨ÙˆØ¦ÛŒÙ†â€ŒØ²Ù‡Ø±Ø§", "Ø¢Ø¨ÛŒÚ©"],
  "Ø³ÛŒØ³ØªØ§Ù† Ùˆ Ø¨Ù„ÙˆÚ†Ø³ØªØ§Ù†": ["Ø²Ø§Ù‡Ø¯Ø§Ù†", "Ø²Ø§Ø¨Ù„", "Ø§ÛŒØ±Ø§Ù†Ø´Ù‡Ø±", "Ú†Ø§Ø¨Ù‡Ø§Ø±", "Ø³Ø±Ø§ÙˆØ§Ù†"],
  "Ù‚Ù…": ["Ù‚Ù…", "Ù‚Ù†ÙˆØ§Øª", "Ø¬Ø¹ÙØ±ÛŒÙ‡", "Ú©Ù‡Ú©"],
  "Ú¯Ù„Ø³ØªØ§Ù†": ["Ú¯Ø±Ú¯Ø§Ù†", "Ú¯Ù†Ø¨Ø¯ Ú©Ø§ÙˆÙˆØ³", "Ø¨Ù†Ø¯Ø± ØªØ±Ú©Ù…Ù†", "Ø¹Ù„ÛŒâ€ŒØ¢Ø¨Ø§Ø¯ Ú©ØªÙˆÙ„"],
  "Ú©Ø±Ø¯Ø³ØªØ§Ù†": ["Ø³Ù†Ù†Ø¯Ø¬", "Ø³Ù‚Ø²", "Ù…Ø±ÛŒÙˆØ§Ù†", "Ø¨Ø§Ù†Ù‡", "Ù‚Ø±ÙˆÙ‡"],
  "Ù„Ø±Ø³ØªØ§Ù†": ["Ø®Ø±Ù…â€ŒØ¢Ø¨Ø§Ø¯", "Ø¨Ø±ÙˆØ¬Ø±Ø¯", "Ø¯ÙˆØ±ÙˆØ¯", "Ú©ÙˆÙ‡Ø¯Ø´Øª", "Ø§Ù„ÛŒÚ¯ÙˆØ¯Ø±Ø²"],
  "Ø¨ÙˆØ´Ù‡Ø±": ["Ø¨ÙˆØ´Ù‡Ø±", "Ø¨Ø±Ø§Ø²Ø¬Ø§Ù†", "Ø¨Ù†Ø¯Ø± Ú¯Ù†Ø§ÙˆÙ‡", "Ø¨Ù†Ø¯Ø± Ú©Ù†Ú¯Ø§Ù†", "Ø¹Ø³Ù„ÙˆÛŒÙ‡"],
  "Ø²Ù†Ø¬Ø§Ù†": ["Ø²Ù†Ø¬Ø§Ù†", "Ø§Ø¨Ù‡Ø±", "Ø®Ø±Ù…Ø¯Ø±Ù‡", "Ù‚ÛŒØ¯Ø§Ø±"],
  "Ø§Ø±Ø¯Ø¨ÛŒÙ„": ["Ø§Ø±Ø¯Ø¨ÛŒÙ„", "Ù¾Ø§Ø±Ø³â€ŒØ¢Ø¨Ø§Ø¯", "Ù…Ø´Ú¯ÛŒÙ†â€ŒØ´Ù‡Ø±", "Ø®Ù„Ø®Ø§Ù„"],
  "Ø³Ù…Ù†Ø§Ù†": ["Ø³Ù…Ù†Ø§Ù†", "Ø´Ø§Ù‡Ø±ÙˆØ¯", "Ø¯Ø§Ù…ØºØ§Ù†", "Ú¯Ø±Ù…Ø³Ø§Ø±"],
  "Ú†Ù‡Ø§Ø±Ù…Ø­Ø§Ù„ Ùˆ Ø¨Ø®ØªÛŒØ§Ø±ÛŒ": ["Ø´Ù‡Ø±Ú©Ø±Ø¯", "Ø¨Ø±ÙˆØ¬Ù†", "ÙØ±Ø®â€ŒØ´Ù‡Ø±", "ÙØ§Ø±Ø³Ø§Ù†"],
  "Ø§ÛŒÙ„Ø§Ù…": ["Ø§ÛŒÙ„Ø§Ù…", "Ø¯Ù‡Ù„Ø±Ø§Ù†", "Ø§ÛŒÙˆØ§Ù†", "Ø¢Ø¨Ø¯Ø§Ù†Ø§Ù†"],
  "Ú©Ù‡Ú¯ÛŒÙ„ÙˆÛŒÙ‡ Ùˆ Ø¨ÙˆÛŒØ±Ø§Ø­Ù…Ø¯": ["ÛŒØ§Ø³ÙˆØ¬", "Ø¯ÙˆÚ¯Ù†Ø¨Ø¯Ø§Ù†", "Ø¯Ù‡Ø¯Ø´Øª"],
  "Ø®Ø±Ø§Ø³Ø§Ù† Ø´Ù…Ø§Ù„ÛŒ": ["Ø¨Ø¬Ù†ÙˆØ±Ø¯", "Ø´ÛŒØ±ÙˆØ§Ù†", "Ø§Ø³ÙØ±Ø§ÛŒÙ†"],
  "Ø®Ø±Ø§Ø³Ø§Ù† Ø¬Ù†ÙˆØ¨ÛŒ": ["Ø¨ÛŒØ±Ø¬Ù†Ø¯", "Ù‚Ø§Ø¦Ù†", "ÙØ±Ø¯ÙˆØ³", "Ø·Ø¨Ø³"],
};

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const { cartItems, totalPrice } = useCart() as any;

  const items = cartItems || [];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("ØªÙ‡Ø±Ø§Ù†");
  const [city, setCity] = useState("ØªÙ‡Ø±Ø§Ù†");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [formError, setFormError] = useState("");

  // Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ø§Ø² Ø­Ø§ÙØ¸Ù‡ Ø¶Ø¯ Ø±ÙØ±Ø´
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(MODAL_DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.firstName) setFirstName(d.firstName);
        if (d.lastName) setLastName(d.lastName);
        if (d.phone) setPhone(d.phone);
        if (d.province && IRAN_PROVINCES_MAP[d.province]) {
          setProvince(d.province);
          if (d.city) setCity(d.city);
        }
        if (d.postalCode) setPostalCode(d.postalCode);
        if (d.address) setAddress(d.address);
        if (d.notes) setNotes(d.notes);
      }
      const userRaw = localStorage.getItem("axon_user_session");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u && u.phone) {
          const clean = String(u.phone).replace(/\D/g, "");
          setPhone((prev) => prev || clean);
          setVerifiedPhone(clean);
          setIsPhoneVerified(true);
        }
      }
    } catch {}
  }, []);

  // Ø°Ø®ÛŒØ±Ù‡ Ø¢Ù†ÛŒ Ø¯Ø± Ø­Ø§ÙØ¸Ù‡ Ø¶Ø¯ Ø±ÙØ±Ø´
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        MODAL_DRAFT_KEY,
        JSON.stringify({ firstName, lastName, phone, province, city, postalCode, address, notes })
      );
    } catch {}
  }, [firstName, lastName, phone, province, city, postalCode, address, notes]);

  if (!isOpen) return null;

  const provincesList = Object.keys(IRAN_PROVINCES_MAP);
  const citiesList = IRAN_PROVINCES_MAP[province] || ["ØªÙ‡Ø±Ø§Ù†"];

  const basePrice =
    typeof totalPrice === "number"
      ? totalPrice
      : items.reduce(
          (sum: number, item: any) =>
            sum + Number(item.price || 0) * Number(item.quantity || 1),
          0
        );

  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage({ type: "error", text: "Ù„Ø·ÙØ§Ù‹ Ú©Ø¯ ØªØ®ÙÛŒÙ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯." });
      return;
    }

    soundEngine.playClick();
    setCouponLoading(true);
    setCouponMessage(null);

    try {
      const res = await couponService.validateCoupon(couponCode, basePrice);
      if (res.valid && res.coupon) {
        soundEngine.playSuccess();
        setDiscountAmount(res.discount);
        setAppliedCoupon(res.coupon);
        setCouponMessage({ type: "success", text: res.message });
      } else {
        setCouponMessage({ type: "error", text: res.message });
        setDiscountAmount(0);
        setAppliedCoupon(null);
      }
    } catch {
      setCouponMessage({ type: "error", text: "Ø®Ø·Ø§ Ø¯Ø± Ø¨Ø±Ø±Ø³ÛŒ Ú©Ø¯ ØªØ®ÙÛŒÙ." });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    soundEngine.playClick();
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode("");
    setCouponMessage(null);
  };

  const finalizeModalOrder = async (cleanPhone: string, cleanPostal: string) => {
    setSubmitting(true);
    const fullName = (firstName.trim() + " " + lastName.trim()).trim() || "Ø®Ø±ÛŒØ¯Ø§Ø± Ù…Ø­ØªØ±Ù…";

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            fullName,
            phone: cleanPhone,
            province,
            city,
            address: address.trim(),
            postalCode: cleanPostal,
            notes: notes.trim(),
          },
          items,
          subtotal: basePrice,
          discountAmount,
          shippingCost: 0,
          finalAmount: finalPrice,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.order) {
        soundEngine.playSuccess();
        onClose();
        router.push(
          "/checkout/payment?orderId=" +
            encodeURIComponent(json.order.id) +
            "&trackingCode=" +
            encodeURIComponent(json.order.tracking_code || json.order.id) +
            "&amount=" +
            finalPrice +
            "&phone=" +
            encodeURIComponent(cleanPhone)
        );
      } else {
        setFormError(json.message || "Ø®Ø·Ø§ Ø¯Ø± Ø«Ø¨Øª Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø³ÙØ§Ø±Ø´.");
      }
    } catch {
      setFormError("Ø®Ø·Ø§ Ø¯Ø± Ø«Ø¨Øª Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø³ÙØ§Ø±Ø´ Ø¯Ø± Ø³ÛŒØ³ØªÙ….");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setFormError("");

    const cleanPhone = phone
      .trim()
      .replace(/[Û°-Û¹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/\D/g, "");
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      setFormError("Ø´Ù…Ø§Ø±Ù‡ Ù‡Ù…Ø±Ø§Ù‡ Ø¨Ø§ÛŒØ¯ Û±Û± Ø±Ù‚Ù… Ùˆ Ø¨Ø§ Û°Û¹ Ø´Ø±ÙˆØ¹ Ø´ÙˆØ¯.");
      return;
    }

    const cleanPostal = postalCode.trim().replace(/\D/g, "");
    if (cleanPostal && cleanPostal.length !== 10) {
      setFormError("Ú©Ø¯ Ù¾Ø³ØªÛŒ Û±Û° Ø±Ù‚Ù…ÛŒ Ø§ÛŒØ±Ø§Ù† Ø¨Ø§ÛŒØ¯ Ø¯Ù‚ÛŒÙ‚Ø§Ù‹ Û±Û° Ø±Ù‚Ù… Ø¹Ø¯Ø¯ÛŒ Ø¨Ø§Ø´Ø¯.");
      return;
    }

    if (!captchaVerified) {
      setFormError("Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ Ú©Ø¯ Ø§Ù…Ù†ÛŒØªÛŒ Ø¶Ø¯ Ø±Ø¨Ø§Øª Ø±Ø§ ÙˆØ§Ø±Ø¯ Ù†Ù…Ø§ÛŒÛŒØ¯.");
      return;
    }
    if (!address.trim() || address.trim().length < 8) {
      setFormError("Ù„Ø·ÙØ§Ù‹ Ù†Ø´Ø§Ù†ÛŒ Ù¾Ø³ØªÛŒ Ø¯Ù‚ÛŒÙ‚ Ø®ÙˆØ¯ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ù†Ù…Ø§ÛŒÛŒØ¯.");
      return;
    }

    if (isPhoneVerified && verifiedPhone === cleanPhone) {
      await finalizeModalOrder(cleanPhone, cleanPostal);
      return;
    }

    if (!otpStep) {
      setSubmitting(true);
      try {
        const otpRes = await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanPhone, action: "send" }),
        });
        const otpJson = await otpRes.json();
        if (otpRes.ok && otpJson.success !== false) {
          setOtpStep(true);
        } else {
          setFormError(otpJson.message || "Ø®Ø·Ø§ Ø¯Ø± Ø§Ø±Ø³Ø§Ù„ Ú©Ø¯ ØªØ§ÛŒÛŒØ¯ Ù¾ÛŒØ§Ù…Ú©ÛŒ.");
        }
      } catch {
        setFormError("Ø®Ø·Ø§ Ø¯Ø± Ø§Ø±ØªØ¨Ø§Ø· Ø¨Ø§ Ø³Ø§Ù…Ø§Ù†Ù‡ Ù¾ÛŒØ§Ù…Ú©.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ØªØ§ÛŒÛŒØ¯ Ú©Ø¯ OTP Ùˆ Ø§Ù†ØªÙ‚Ø§Ù„ Ø¨Ù‡ Ø¯Ø±Ú¯Ø§Ù‡ Ù¾Ø±Ø¯Ø§Ø®Øª
    setSubmitting(true);
    try {
      const vRes = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          code: otpCode.trim(),
          action: "verify",
        }),
      });
      const vJson = await vRes.json();
      if (vRes.ok && (vJson.verified || vJson.success)) {
        setIsPhoneVerified(true);
        setVerifiedPhone(cleanPhone);
        await finalizeModalOrder(cleanPhone, cleanPostal);
      } else {
        setFormError(vJson.message || "Ú©Ø¯ ØªØ§ÛŒÛŒØ¯ ÙˆØ§Ø±Ø¯ Ø´Ø¯Ù‡ Ù†Ø§Ø¯Ø±Ø³Øª Ø§Ø³Øª.");
        setSubmitting(false);
      }
    } catch {
      setFormError("Ø®Ø·Ø§ Ø¯Ø± Ø¨Ø±Ø±Ø³ÛŒ Ú©Ø¯ ØªØ§ÛŒÛŒØ¯.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-5 sm:p-8 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-blue)] transition cursor-pointer"
        >
          âœ•
        </button>

        <div className="flex items-center gap-2 mb-5 border-b border-[var(--card-border)] pb-4 text-right">
          <span className="text-sm md:text-xl">ðŸ›¡ï¸</span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
              ØªÚ©Ù…ÛŒÙ„ Ù…Ø´Ø®ØµØ§Øª ØªØ­ÙˆÛŒÙ„ Ùˆ Ø§Ù†ØªÙ‚Ø§Ù„ Ø¨Ù‡ Ø¯Ø±Ú¯Ø§Ù‡ Ù¾Ø±Ø¯Ø§Ø®Øª
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">
              Ø¯Ø§Ø±Ø§ÛŒ Ø­Ø§ÙØ¸Ù‡ Ù‡ÙˆØ´Ù…Ù†Ø¯ ÙØ±Ù… (Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø¨Ø§ Ø±ÙØ±Ø´ Ø´Ø¯Ù† Ù¾Ø§Ú© Ù†Ù…ÛŒâ€ŒØ´ÙˆØ¯)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] mb-5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-secondary)] font-bold">
              Ø§Ù‚Ù„Ø§Ù… Ø³ÙØ§Ø±Ø´ ({items.length} Ù‚Ù„Ù…):
            </span>
            <span className="font-mono font-bold">
              {Number(basePrice).toLocaleString("fa-IR")} ØªÙˆÙ…Ø§Ù†
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold border-t border-[var(--card-border)] pt-2">
              <span>ØªØ®ÙÛŒÙ Ø§Ø¹Ù…Ø§Ù„ Ø´Ø¯Ù‡:</span>
              <span className="font-mono">
                - {Number(discountAmount).toLocaleString("fa-IR")} ØªÙˆÙ…Ø§Ù†
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-black text-[var(--accent-blue)] border-t border-[var(--card-border)] pt-2">
            <span>Ù…Ø¨Ù„Øº Ù†Ù‡Ø§ÛŒÛŒ Ù‚Ø§Ø¨Ù„ Ù¾Ø±Ø¯Ø§Ø®Øª:</span>
            <span className="font-mono text-base">
              {Number(finalPrice).toLocaleString("fa-IR")} ØªÙˆÙ…Ø§Ù†
            </span>
          </div>
        </div>

        <div className="mb-5 p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--modal-bg)] space-y-2 text-xs">
          <label className="block font-bold text-[var(--text-secondary)] text-right">
            Ú©Ø¯ ØªØ®ÙÛŒÙ Ø¯Ø§Ø±ÛŒØ¯ØŸ
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ú©Ø¯ ØªØ®ÙÛŒÙ..."
              value={couponCode}
              disabled={!!appliedCoupon}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-xs focus:border-[var(--accent-blue)] transition disabled:opacity-60 text-right uppercase"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="px-4 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-bold hover:bg-rose-500/25 transition cursor-pointer"
              >
                Ø­Ø°Ù
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                className="px-5 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {couponLoading ? "Ø¨Ø±Ø±Ø³ÛŒ..." : "Ø§Ø¹Ù…Ø§Ù„ ØªØ®ÙÛŒÙ"}
              </button>
            )}
          </div>

          {couponMessage && (
            <div
              className={
                "p-2.5 rounded-xl text-[11px] font-bold text-right " +
                (couponMessage.type === "success"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30")
              }
            >
              {couponMessage.text}
            </div>
          )}
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold text-right">
            âš ï¸ {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-right">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">Ù†Ø§Ù… Ú¯ÛŒØ±Ù†Ø¯Ù‡ *</label>
              <input
                type="text"
                required
                placeholder="Ù…Ø«Ù„Ø§Ù‹: Ù¾ÙˆØ±ÛŒØ§"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold focus:border-[var(--accent-blue)] transition text-right"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">Ù†Ø§Ù… Ø®Ø§Ù†ÙˆØ§Ø¯Ú¯ÛŒ *</label>
              <input
                type="text"
                required
                placeholder="Ù…Ø«Ù„Ø§Ù‹: Ø±Ø­ÛŒÙ…ÛŒ"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold focus:border-[var(--accent-blue)] transition text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">Ø§Ù†ØªØ®Ø§Ø¨ Ø§Ø³ØªØ§Ù† *</label>
              <select
                value={province}
                onChange={(e) => {
                  const nextP = e.target.value;
                  setProvince(nextP);
                  setCity((IRAN_PROVINCES_MAP[nextP] || [])[0] || "");
                }}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold cursor-pointer"
              >
                {provincesList.map((prov) => (
                  <option key={prov} value={prov}>
                    ðŸ“ Ø§Ø³ØªØ§Ù† {prov}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ù‡Ø± *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold cursor-pointer"
              >
                {citiesList.map((c) => (
                  <option key={c} value={c}>
                    ðŸ™ï¸ {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                Ø´Ù…Ø§Ø±Ù‡ ØªÙ„ÙÙ† Ù‡Ù…Ø±Ø§Ù‡ (Û±Û± Ø±Ù‚Ù…) *
              </label>
              <input
                type="tel"
                required
                maxLength={11}
                placeholder="09123456789"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setOtpStep(false);
                }}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold focus:border-[var(--accent-blue)] transition text-center"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                Ú©Ø¯ Ù¾Ø³ØªÛŒ Û±Û° Ø±Ù‚Ù…ÛŒ Ø§ÛŒØ±Ø§Ù† (Ø§Ø®ØªÛŒØ§Ø±ÛŒ)
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="Ú©Ø¯ Û±Û° Ø±Ù‚Ù…ÛŒ Ø¨Ø¯ÙˆÙ† Ø®Ø· ØªÛŒØ±Ù‡"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold focus:border-[var(--accent-blue)] transition text-center"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">
              Ù†Ø´Ø§Ù†ÛŒ Ø¯Ù‚ÛŒÙ‚ Ù¾Ø³ØªÛŒ ØªØ­ÙˆÛŒÙ„ *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Ø®ÛŒØ§Ø¨Ø§Ù†ØŒ Ú©ÙˆÚ†Ù‡ØŒ Ù¾Ù„Ø§Ú©ØŒ ÙˆØ§Ø­Ø¯..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-medium leading-relaxed focus:border-[var(--accent-blue)] transition text-right"
            />
          </div>

          {otpStep && (
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-2 animate-fadeIn">
              <label className="block font-black text-sky-400">
                ðŸ“² Ú©Ø¯ ØªØ§ÛŒÛŒØ¯ Ù¾ÛŒØ§Ù…Ú©â€ŒØ´Ø¯Ù‡ Ø¨Ù‡ Ø´Ù…Ø§Ø±Ù‡ {phone} Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯:
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                dir="ltr"
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Ú©Ø¯ ØªØ§ÛŒÛŒØ¯ Ù¾ÛŒØ§Ù…Ú©ÛŒ"
                className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-sky-500 font-mono font-black text-lg text-center tracking-widest outline-none"
              />
            </div>
          )}

          <SecurityCaptchaBox onVerifyChange={setCaptchaVerified} />
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !captchaVerified}
              className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs transition cursor-pointer shadow-xl shadow-blue-500/25 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting
                ? "Ø¯Ø± Ø­Ø§Ù„ Ù¾Ø±Ø¯Ø§Ø²Ø´..."
                : otpStep
                ? "âœ“ ØªØ§ÛŒÛŒØ¯ Ú©Ø¯ Ù¾ÛŒØ§Ù…Ú©ÛŒ Ùˆ ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ø¯Ø±Ú¯Ø§Ù‡ Ù¾Ø±Ø¯Ø§Ø®Øª ðŸ’³"
                : "ØªØ§ÛŒÛŒØ¯ Ù†Ù‡Ø§ÛŒÛŒ Ùˆ Ù¾Ø±Ø¯Ø§Ø®Øª Ø¢Ù†Ù„Ø§ÛŒÙ† ðŸ’³"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
