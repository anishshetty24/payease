"use client";
import { useState, useCallback } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

let toastId = 0;

export function AddMoney({ onSuccess }: { onSuccess?: () => void }) {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: Toast["type"], message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handlePayment = useCallback(async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount < 1) {
      addToast("error", "Please enter a valid amount (minimum ₹1)");
      return;
    }
    if (parsedAmount > 100000) {
      addToast("error", "Maximum amount per transaction is ₹1,00,000");
      return;
    }

    setLoading(true);

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        addToast("error", "Failed to load payment gateway. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Create Razorpay order
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        addToast("error", orderData.error || "Failed to create payment order");
        setLoading(false);
        return;
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "PayEase",
        description: `Add ₹${parsedAmount} to wallet`,
        order_id: orderData.orderId,
        theme: {
          color: "#7c3aed",
          backdrop_color: "rgba(10,10,15,0.9)",
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            addToast("info", "Payment cancelled");
            setLoading(false);
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 4. Verify payment on server
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              addToast("success", `₹${parsedAmount} added to your wallet successfully! 🎉`);
              setAmount("");
              onSuccess?.();
              // Reload to show updated balance
              setTimeout(() => window.location.reload(), 1500);
            } else {
              addToast("error", verifyData.error || "Payment verification failed");
            }
          } catch {
            addToast("error", "Payment verification failed. Contact support.");
          }
          setLoading(false);
        },
        prefill: {},
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        addToast("error", `Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      addToast("error", err.message || "Something went wrong");
      setLoading(false);
    }
  }, [amount, onSuccess]);

  return (
    <>
      {/* Toast notifications */}
      <div
        style={{
          position: "fixed",
          top: "80px",
          right: "20px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "white",
              maxWidth: "320px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
              animation: "fadeIn 0.3s ease-out",
              backdropFilter: "blur(12px)",
              pointerEvents: "all",
              ...(toast.type === "success"
                ? {
                    background: "rgba(16,185,129,0.9)",
                    border: "1px solid rgba(16,185,129,0.5)",
                  }
                : toast.type === "error"
                ? {
                    background: "rgba(239,68,68,0.9)",
                    border: "1px solid rgba(239,68,68,0.5)",
                  }
                : {
                    background: "rgba(99,102,241,0.9)",
                    border: "1px solid rgba(99,102,241,0.5)",
                  }),
            }}
          >
            {toast.type === "success" ? "✅ " : toast.type === "error" ? "❌ " : "ℹ️ "}
            {toast.message}
          </div>
        ))}
      </div>

      <div
        style={{
          background: "rgba(15,15,26,0.9)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px",
          padding: "28px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Card accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
          }}
        />

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.15))",
                border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f0ff", fontFamily: "'Outfit', sans-serif" }}>
                Add Money
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(154,154,176,0.8)", marginTop: "1px" }}>
                Fund your wallet via Razorpay
              </p>
            </div>
          </div>
        </div>

        {/* Quick amount chips */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "rgba(154,154,176,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "10px" }}>
            Quick Select
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(String(amt))}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 200ms ease",
                  border: "1px solid",
                  ...(amount === String(amt)
                    ? {
                        background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))",
                        borderColor: "rgba(124,58,237,0.5)",
                        color: "#a78bfa",
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: "rgba(154,154,176,0.9)",
                      }),
                }}
              >
                ₹{amt.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </div>

        {/* Amount input */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "rgba(154,154,176,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "10px" }}>
            Custom Amount
          </label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "18px",
                fontWeight: 600,
                color: "rgba(154,154,176,0.6)",
              }}
            >
              ₹
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              max="100000"
              style={{
                width: "100%",
                padding: "14px 16px 14px 36px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
                color: "#f0f0ff",
                fontSize: "20px",
                fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                outline: "none",
                transition: "all 200ms ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(124,58,237,0.5)";
                e.target.style.background = "rgba(124,58,237,0.05)";
                e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.12)";
                e.target.style.background = "rgba(255,255,255,0.05)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
          {amount && parseFloat(amount) > 0 && (
            <p style={{ fontSize: "12px", color: "rgba(154,154,176,0.6)", marginTop: "8px" }}>
              You will add <span style={{ color: "#a78bfa", fontWeight: 600 }}>₹{parseFloat(amount).toLocaleString("en-IN")}</span> to your wallet
            </p>
          )}
        </div>

        {/* Pay button */}
        <button
          onClick={handlePayment}
          disabled={loading || !amount || parseFloat(amount) < 1}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 700,
            fontFamily: "'Outfit', sans-serif",
            cursor: loading || !amount || parseFloat(amount) < 1 ? "not-allowed" : "pointer",
            border: "none",
            transition: "all 250ms ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            background:
              loading || !amount || parseFloat(amount) < 1
                ? "rgba(124,58,237,0.3)"
                : "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
            color: "white",
            boxShadow:
              loading || !amount || parseFloat(amount) < 1
                ? "none"
                : "0 4px 20px rgba(124,58,237,0.35)",
          }}
          id="razorpay-pay-btn"
        >
          {loading ? (
            <>
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              Processing...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Pay with Razorpay
            </>
          )}
        </button>

        {/* Security note */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            marginTop: "16px",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(154,154,176,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span style={{ fontSize: "12px", color: "rgba(154,154,176,0.5)" }}>
            256-bit SSL encrypted • Powered by Razorpay
          </span>
        </div>
      </div>
    </>
  );
}
// CodeScope Milestone 14: PR review integration test
