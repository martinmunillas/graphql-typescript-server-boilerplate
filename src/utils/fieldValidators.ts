type ValidatorResponse = {
  isValid: boolean;
  message: string;
};

export const passwordIsValid = (password: string): ValidatorResponse => ({
  isValid: password.length >= 6,
  message: 'Passwords must be at least 6 characters long',
});

export const emailIsValid = (email: string): ValidatorResponse => ({
  isValid: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email),
  message: 'Invalid email',
});

export const usernameIsValid = (username: string): ValidatorResponse => ({
  isValid: /^[A-z_\d]{1,10}$/.test(username),
  message: 'Invalid username',
});
