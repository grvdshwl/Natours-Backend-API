async function updateSettings(bodyData, type) {
  try {
    const url =
      type === 'password'
        ? 'http://localhost:3000/api/v1/users/updatePassword'
        : 'http://localhost:3000/api/v1/users/me';

    const updateRequest = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/JSON'
      },
      body: JSON.stringify(bodyData)
    });

    const data = await updateRequest.json();

    if (data.status === 'Fail') {
      throw new Error(data.message);
    }

    if (data.status === 'Success') {
      showAlert('success', `${type.toUpperCase()} UPDATED!`);
    }
  } catch (error) {
    showAlert('error', error);
  }
}

if (document.querySelector('.form-user-data')) {
  document
    .querySelector('.form-user-data')
    .addEventListener('submit', event => {
      event.preventDefault();

      const email = document.getElementById('email')?.value;
      const name = document.getElementById('name')?.value;

      updateSettings({ email, name }, 'data');
    });
}

if (document.querySelector('.form-user-password')) {
  document
    .querySelector('.form-user-password')
    .addEventListener('submit', async event => {
      event.preventDefault();
      document.querySelector('.btn--save-password').textContent =
        'Updating....';

      const password = document.getElementById('password')?.value;
      const passwordCurrent = document.getElementById('password-current')
        ?.value;
      const passwordConfirm = document.getElementById('password-confirm')
        ?.value;

      await updateSettings(
        { password, passwordConfirm, passwordCurrent },
        'password'
      );

      document.querySelector('.btn--save-password').textContent =
        'Save Password';
      document.getElementById('password').value = '';
      document.getElementById('password-current').value = '';
      document.getElementById('password-confirm').value = '';
    });
}
