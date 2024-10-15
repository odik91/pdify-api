const getById = (id) => {
  return document.getElementById(id);
};

const password = getById("password");
const confirmPassword = getById("confirm-password");
const form = getById("form");
const container = getById("container");
const loader = getById("loader");
const button = getById("submit");
const error = getById("error");
const success = getById("success");

error.style.display = "none";
success.style.display = "none";
container.style.display = "none";

let token, userId;
const regexPattren = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/

window.addEventListener("DOMContentLoaded", async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => {
      return searchParams.get(prop);
    },
  });
  token = params.token;
  userId = params.userId;

  const res = await fetch("/auth/verify-pass-reset-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({
      token,
      userId,
    }),
  });

  if (!res.ok) {
    const { message } = await res.json();
    console.log(message);

    loader.innerText = message;
    return;
  }

  loader.style.display = "none";
  container.style.display = "block";
});

const displayError = (errorMessage) => {
  success.style.display = 'none'
  error.innerText = errorMessage
  error.style.display = 'block'
}

const displaySuccess = (successMessage) => {
  error.style.display = 'none'
  success.innerText = successMessage
  success.style.display = 'block'
}

const handleSubmit = async (e) => {
  e.preventDefault()

  if (!password.value.trim()) {
    return displayError("Please provide password")
  }

  if (!regexPattren.test(password.value.trim())) {
    return displayError("Password is too simple, use alpha numeric with special characters!")
  }

  if (password.value.trim() !== confirmPassword.value.trim()) {
    return displayError("Password do not match")
  }

  button.disabled = true
  button.innerText = 'Please wait...'

  const res = await fetch("/auth/update-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({
      token,
      userId,
      password: password.value.trim()
    }),
  });

  button.disabled = false
  button.innerText = 'Reset Password'

  if (!res.ok) {
    const { message } = await res.json()
    return displayError(message)
  }

  displaySuccess('Your password is reset successfully')
  form.reset()
}

form.addEventListener('submit', handleSubmit)