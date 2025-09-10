const API_BASE_URL = "https://simp-api.dev.crymzee.com/api";
let selectedImageFile = null;

const elements = {
  firstName: document.getElementById("firstName"),
  lastName: document.getElementById("lastName"),
  username: document.getElementById("username"),
  signupEmail: document.getElementById("signupEmail"),
  phoneNumber: document.getElementById("phoneNumber"),
  signupPassword: document.getElementById("signupPassword"),
  confirmPassword: document.getElementById("confirmPassword"),
  profileImage: document.getElementById("profileImage"),
  imagePreview: document.getElementById("imagePreview"),
  removeImageBtn: document.getElementById("removeImageBtn"),
  submitBtn: document.getElementById("submitBtn"),
  signupMessage: document.getElementById("signupMessage"),
};

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(inputId + "Toggle");

  const show = input.type === "password";
  input.type = show ? "text" : "password";
  icon.classList.toggle("fa-eye", !show);
  icon.classList.toggle("fa-eye-slash", show);
}

function validatePassword(password) {
  return {
    length: password.length >= 8,
    capital: /[A-Z]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
}

function updatePasswordRequirements(password) {
  const reqs = validatePassword(password);

  document.getElementById("lengthReq").className = reqs.length
    ? "requirement valid"
    : "requirement invalid";

  document.getElementById("capitalReq").className = reqs.capital
    ? "requirement valid"
    : "requirement invalid";

  document.getElementById("specialReq").className = reqs.special
    ? "requirement valid"
    : "requirement invalid";

  return reqs.length && reqs.capital && reqs.special;
}

function validatePhoneNumber(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11 && /^03\d{9}$/.test(digits);
}

function showMessage(message, type = "info") {
  elements.signupMessage.textContent = message;
  elements.signupMessage.className = `message ${type}`;
  elements.signupMessage.style.display = "block";

  if (type === "error") {
    setTimeout(() => (elements.signupMessage.style.display = "none"), 5000);
  }
}

function hideMessage() {
  elements.signupMessage.style.display = "none";
}

function setLoading(button, isLoading) {
  button.disabled = isLoading;
  button.classList.toggle("loading", isLoading);

  if (!isLoading) checkFormValidity();
}

function clearImagePreview() {
  elements.imagePreview.innerHTML = `
    <div class="image-placeholder">
      <i class="fas fa-camera"></i>
      <span>Add Photo</span>
    </div>
    <input type="file" class="image-upload-input" id="profileImage" accept="image/jpeg,image/jpg,image/png,image/webp" required>
    <button type="button" class="image-remove-btn" id="removeImageBtn">
      <i class="fas fa-times"></i>
    </button>
  `;

  elements.imagePreview.classList.remove("has-image");
  selectedImageFile = null;
  checkFormValidity();

  document.getElementById("profileImage").addEventListener("change", handleImageChange);
  document.getElementById("removeImageBtn").addEventListener("click", clearImagePreview);
}

function handleImageChange(e) {
  const file = e.target.files[0];
  if (!file) return clearImagePreview();

  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    showMessage("Please select a valid image file (JPEG, PNG, WebP).", "error");
    return clearImagePreview();
  }

  if (file.size > 5 * 1024 * 1024) {
    showMessage("Image size must be less than 5MB.", "error");
    return clearImagePreview();
  }

  selectedImageFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    elements.imagePreview.innerHTML = `
      <img src="${ev.target.result}" alt="Profile Preview">
      <button type="button" class="image-remove-btn" id="removeImageBtn">
        <i class="fas fa-times"></i>
      </button>
    `;
    elements.imagePreview.classList.add("has-image");

    document.getElementById("removeImageBtn").addEventListener("click", clearImagePreview);
    checkFormValidity();
  };
  reader.readAsDataURL(file);
}

function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) =>
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target.result,
        lastModified: file.lastModified,
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function sendOTP(email, otpType = "create") {
  try {
    const res = await fetch(`${API_BASE_URL}/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp_type: otpType, role: "user" }),
    });

    const data = await res.json();
    return { success: res.ok, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function checkFormValidity() {
  const first = elements.firstName.value.trim();
  const last = elements.lastName.value.trim();
  const user = elements.username.value.trim();
  const email = elements.signupEmail.value.trim();
  const phone = elements.phoneNumber.value.trim();
  const pass = elements.signupPassword.value;
  const confirm = elements.confirmPassword.value;

  const isValid =
    selectedImageFile &&
    first &&
    last &&
    user &&
    email &&
    phone &&
    validatePhoneNumber(phone) &&
    pass &&
    confirm &&
    updatePasswordRequirements(pass) &&
    pass === confirm;

  elements.submitBtn.disabled = !isValid;
}

function setupEventListeners() {
  elements.phoneNumber.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    e.target.value = v;
    checkFormValidity();
  });

  elements.phoneNumber.addEventListener("blur", (e) => {
    if (e.target.value && !validatePhoneNumber(e.target.value)) {
      showMessage("Enter a valid Pakistani mobile number (11 digits, starting with 03).", "error");
      e.target.style.borderColor = "#ff4444";
    } else {
      e.target.style.borderColor = "#e8e8e8";
      hideMessage();
    }
  });

  elements.signupPassword.addEventListener("input", (e) => {
    updatePasswordRequirements(e.target.value);
    checkFormValidity();
  });
  elements.signupPassword.addEventListener("focus", () => {
    document.getElementById("passwordRequirements").style.display = "block";
  });

  elements.confirmPassword.addEventListener("input", (e) => {
    e.target.style.borderColor =
      elements.signupPassword.value !== e.target.value ? "#ff4444" : "#e8e8e8";
    if (elements.signupPassword.value !== e.target.value) {
      showMessage("Passwords do not match.", "error");
    } else {
      hideMessage();
    }
    checkFormValidity();
  });

  elements.profileImage.addEventListener("change", handleImageChange);
  elements.removeImageBtn.addEventListener("click", clearImagePreview);

  [elements.firstName, elements.lastName, elements.username, elements.signupEmail].forEach((el) =>
    el.addEventListener("input", checkFormValidity)
  );

  document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!selectedImageFile) return showMessage("Please add a profile picture.", "error");

    const { firstName, lastName, username, signupEmail, phoneNumber, signupPassword, confirmPassword } =
      elements;

    // ✅ snake_case for backend
    const payload = {
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      username: username.value.trim(),
      email: signupEmail.value.trim(),
      phone: phoneNumber.value.trim(),
      password: signupPassword.value,
      confirm_password: confirmPassword.value,
    };

    if (!validatePhoneNumber(payload.phone)) {
      return showMessage("Invalid phone number format.", "error");
    }
    if (payload.password !== payload.confirm_password) {
      return showMessage("Passwords do not match.", "error");
    }
    if (!updatePasswordRequirements(payload.password)) {
      return showMessage("Password does not meet requirements.", "error");
    }

    try {
      setLoading(elements.submitBtn, true);
      const imageBase64 = await convertImageToBase64(selectedImageFile);

      const result = await sendOTP(payload.email, "create");
      if (result.success) {
        // ✅ snake_case & profile_image
        window.signupData = {
          ...payload,
          profile_image: imageBase64,
          verificationToken: result.data.verification_token,
        };
        showMessage("OTP sent successfully! Redirecting...", "success");

        setTimeout(() => {
          window.location.href = `otp.html?email=${encodeURIComponent(payload.email)}&type=create`;
        }, 2000);
      } else {
        showMessage(result.data?.message || "Failed to send OTP.", "error");
      }
    } catch (err) {
      console.error("Signup error:", err);
      showMessage("An error occurred. Please try again.", "error");
    } finally {
      setLoading(elements.submitBtn, false);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  checkFormValidity();
});

window.togglePassword = togglePassword;
