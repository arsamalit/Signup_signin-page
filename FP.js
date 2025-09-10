   const API_BASE_URL = "";

  const emailInput = document.getElementById("loginEmail");
  const otpInput = document.getElementById("otp_code");
  const passwordInput = document.getElementById("Password");
  const confirmInput = document.getElementById("Confirm_password");

  const verificationBtn = document.getElementById("verification_btn");
  const verifyOtpBtn = document.getElementById("verify_otp");
  const nextBtn = document.getElementById("next_btn");
  const changePasswordBtn = document.getElementById("new_password");
  const resendOtpBtn = document.getElementById("resend_otp");

  const emailStep = document.getElementById("emailStep");
  const otpStep = document.getElementById("otpStep");
  const resetStep = document.getElementById("resetStep");

  const loader = document.getElementById("loader");
  const errorBox = document.getElementById("errorBox");
  const okBox = document.getElementById("ok");

  let verificationToken = "";
  let otpVerified = false;

  function showLoader(show) {
    loader.style.display = show ? "block" : "none";
  }

  function showError(msg) {
    errorBox.innerText = msg;
    errorBox.style.display = "block";
    setTimeout(() => (errorBox.style.display = "none"), 5000);
  }

  function showOK(msg) {
    okBox.innerText = msg;
    okBox.style.display = "block";
    setTimeout(() => (okBox.style.display = "none"), 5000);
  }

  // ✅ Send OTP
  async function Send_OTP(email) {
    if (!email.value.trim()) return showError("Enter your email first.");

    verificationToken = "";
    otpVerified = false;

    showLoader(true);

    try {
      let res = await fetch(`${API_BASE_URL}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.value.trim(),
          otp_type: "forgot",
          role: "user",
        }),
      });

      let data = await res.json();

      if (res.ok) {
        showOK("OTP sent successfully to your email.");
        emailStep.style.display = "none";
        otpStep.style.display = "block";
      } else {
        showError(data.message || `Failed to send OTP. Status: ${res.status}`);
        console.error("OTP send failed:", data);
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      showError("Network error occurred while sending OTP.");
    } finally {
      showLoader(false);
    }
  }

  // ✅ Verify OTP
  async function OTP_VERIFY(email, otp) {
    if (!otp.value.trim()) return showError("Enter the OTP code.");
    showLoader(true);

    try {
      const res = await fetch(`${API_BASE_URL}/otp/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.value.trim(),
          otp_code: otp.value.trim(),
          otp_type: "forgot",
          role: "user",
        }),
      });

      const data = await res.json();
      console.log("OTP VERIFY response:", data);

      // ✅ Handle both token or verification_token
      if (res.ok && (data.verification_token || data.token)) {
        verificationToken = String(
          data.verification_token || data.token
        );
        otpVerified = true;
        showOK("OTP verified successfully.");
        nextBtn.style.display = "block";
      } else {
        showError(data.message || "Failed to verify OTP.");
        verificationToken = "";
        otpVerified = false;
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      showError("Network error occurred while verifying OTP.");
      verificationToken = "";
      otpVerified = false;
    } finally {
      showLoader(false);
    }
  }

  // ✅ Change Password
  async function ChangePassword(password, confirm_password) {
    if (!otpVerified || !verificationToken) {
      showError("Please verify your OTP first before changing password.");
      return;
    }

    showLoader(true);

    try {
      const payload = {
        password: password.value.trim(),
        confirm_password: confirm_password.value.trim(),
        verification_token: String(verificationToken),
        role: "user",
      };

      console.log("Sending reset payload:", payload);

      const res = await fetch(`${API_BASE_URL}/profile/password/reset`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Password reset response:", data);

      if (res.ok) {
        showOK("Password changed successfully. Redirecting to login...");
        verificationToken = "";
        otpVerified = false;

        passwordInput.value = "";
        confirmInput.value = "";

        setTimeout(() => {
          document.getElementById("logi").style.display = "block";
        }, 2000);
      } else {
        showError(data.message || "Failed to change password.");
        if (res.status === 401 || res.status === 403) {
          verificationToken = "";
          otpVerified = false;
          showError(
            "Session expired. Please restart the password reset process."
          );
        }
      }
    } catch (err) {
      console.error("Error changing password:", err);
      showError("Network error occurred while changing password.");
    } finally {
      showLoader(false);
    }
  }

  // ✅ Event Listeners
  verificationBtn.addEventListener("click", () => {
    if (!emailInput.value.trim()) {
      return showError("Please enter your email.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
      return showError("Please enter a valid email address.");
    }
    Send_OTP(emailInput);
  });

  verifyOtpBtn.addEventListener("click", () => {
    if (!otpInput.value.trim()) {
      return showError("Please enter the OTP code.");
    }
    if (!/^\d{4,6}$/.test(otpInput.value.trim())) {
      return showError("Please enter a valid OTP (4-6 digits).");
    }
    OTP_VERIFY(emailInput, otpInput);
  });

  nextBtn.addEventListener("click", () => {
    if (!otpVerified) {
      return showError("Please verify your OTP first.");
    }
    otpStep.style.display = "none";
    resetStep.style.display = "block";
  });

  changePasswordBtn.addEventListener("click", () => {
    if (!passwordInput.value.trim() || !confirmInput.value.trim()) {
      return showError("Please fill all password fields.");
    }
    if (passwordInput.value !== confirmInput.value) {
      return showError("Passwords do not match.");
    }
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(passwordInput.value)) {
      return showError(
        "Password must be 8+ characters with uppercase, lowercase, number, and special character."
      );
    }
    ChangePassword(passwordInput, confirmInput);
  });

  resendOtpBtn.addEventListener("click", () => {
    if (!emailInput.value.trim()) {
      return showError(
        "Email is missing. Please go back and enter your email."
      );
    }
    Send_OTP(emailInput);
  });

  function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input && icon) {
      icon.addEventListener("click", () => {
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        icon.classList.toggle("fa-eye", !isPassword);
        icon.classList.toggle("fa-eye-slash", isPassword);
      });
    }
  }

  togglePasswordVisibility("Password", "toggle_Password");
  togglePasswordVisibility("Confirm_password", "toggle_C_Password");

 
