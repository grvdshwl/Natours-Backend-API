async function login(email, password) {
  try {
    const loginRequest = await fetch(
      'http://localhost:3000/api/v1/users/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/JSON'
        },
        body: JSON.stringify({ email, password })
      }
    );

    const data = await loginRequest.json();

    if (data.status === 'Fail') {
      throw new Error(data.message);
    }

    if (data.status === 'Success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (error) {
    showAlert('error', error);
  }
}

if (document.querySelector('.form--login')) {
  document.querySelector('.form--login').addEventListener('submit', event => {
    event.preventDefault();

    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    login(email, password);
  });
}

async function logout() {
  try {
    const loginRequest = await fetch(
      'http://localhost:3000/api/v1/users/logout'
    );

    const data = await loginRequest.json();
    console.log(data);

    if (data.status === 'Fail') {
      throw new Error(data.message);
    }

    if (data.status === 'Success') {
      showAlert('success', 'Logged out successfully');
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (error) {
    showAlert('error', 'Failed to logout user.');
  }
}

if (document.querySelector('.nav__el--logout')) {
  document.querySelector('.nav__el--logout').addEventListener('click', () => {
    logout();
  });
}
