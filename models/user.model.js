const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    unique: true,
    maxlength: [50, 'A user name must have less or equal then 50 characters'],
    minlength: [2, 'A user name must have more or equal then 2 characters']
  },
  email: {
    type: String,
    required: [true, 'A user must have a email'],
    validate: {
      validator(value) {
        return !!value.match(
          /([a-zA-Z0-9\-_$()&!]+)(@)([a-zA-Z0-9]+)(\.)([a-zA-Z]{2,})/g
        );
      },
      message: 'Invalid email format : {{VALUE}}'
    },
    unique: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'user', 'guide', 'lead-guide'],
      message: 'Invalid Role'
    },
    default: 'user'
  },
  photo: {
    type: String
  },
  password: {
    type: String,
    select: false,
    required: [true, 'A user must have a password'],
    minlength: [8, 'A password must have more or equal then 8 characters']
    // validate: {
    //   validator(value) {
    //     return !!value.match(
    //       /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%&^()_\-.])([a-zA-Z0-9!@#$%&^()_\-.]{8,})/g
    //     );
    //   },
    //   message:
    //     'Invalid password format : {{VALUE}}.\nPassword must have atleast upper case letter , a lower case letter , a number and a special character.'
    // }
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A user must have a confirm password'],
    validate: {
      validator(value) {
        return value === this.password;
      },
      message: 'passwordConfirm {{VALUE}} must be equal to password.'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next) {
  //only allows function to run if password was created or modified.
  if (!this.isModified('password')) return next();

  //hashing the password.
  this.password = await bcrypt.hash(this.password, 11);

  //delete passwordConfirm field before save or update.
  this.passwordConfirm = undefined;
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  //current query

  this.find({ active: { $ne: false } });

  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.checkPasswordUpdated = function(jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return changedTimeStamp > jwtTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
