const User = require("../models/userSchema");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require("../services/tokenService");
const crypto = require("crypto");
const transporter = require("../services/emailService");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found");
      return res.status(400).json({
        message: "User not found",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email first",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Password incorrect");
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokens.push(refreshToken);

    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.json({
      message: "Login successful",
      accessToken,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({
      message: "Server Error from /login",
      error: err.message,
    });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken: hashedToken,
    });
    
    await user.save();
    
    // Send response immediately
    res.status(201).json({
      message: "Registration successful. Please verify your email.",
    });

    // Send email in background
    const verifyLink = `${process.env.CLIENT_URL}/verify-email/${token}`;

    try {
      await transporter.verify();
      console.log("SMTP Connected");
    } catch (mailErr) {
      console.error("verify error:",  mailErr);
    }

      await transporter.sendMail({
        from: process.env.EMAIL,
        to: user.email,
        subject: "Verify Email",
        html: `
          <h2>Verify your account</h2>
          <a href="${verifyLink}">
            Verify Email
          </a>
        `,
      });

      console.log("Verification email sent");
    
  } catch (err) {
     console.log(err.response?.data);
     alert(err.response?.data?.message || err.message);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "no refresh token",
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findOne({
      _id: decoded.userId,
      refreshTokens: refreshToken,
    });

    if (!user) {
      return res.status(401).json({
        message: "refresh token revoked",
      });
    }

    console.log("new access token generated ");

    const accessToken = generateAccessToken(user);

    res.json({
      accessToken,
    });
  } catch (err) {
    console.error("Refresh error:", err.message);
    res.status(403).json({
      message: "Invalid refresh token",
      error: err.message,
    });
  }
};

exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "userNotFound",
      });
    }

    res.json({
      message: "wellcome",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "server error",
      error: err.message,
    });
  }
};

exports.logOutAll = async (req, res) => {
  const user = await User.findById(req.user.userId);

  user.refreshTokens = [];

  await user.save();
  res.clearCookie("refreshToken");

  res.json({
    message: "logged Out from all Devices ",
  });
};

exports.logOut = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);

    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        (token) => token != refreshToken,
      );

      await user.save();
    }

    res.clearCookie("refreshToken");
    res.json({
      message: "logged Out Successfully",
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "user not found from forgotPassword",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: user.email,
      subject: "Password Reset",
      html: `
        <h2>Password Reset</h2>
        <p>Click below:</p>
        <a href="${resetLink}">
          Reset Password
        </a>
      `,
    });

    res.json({
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error(err);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "invalid or expired reset Link",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      message: "password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", err.message);

    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
    });

    if (!user) {
      return res.json({
        message: "Email already verified or invalid link",
      });
    }

    user.isVerified = true;

    user.verificationToken = undefined;

    await user.save();

    res.json({
      message: "Email verified successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Email already verified",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    user.verificationToken = hashedToken;

    await user.save();

    const verifyLink = `${process.env.CLIENT_URL}/verify-email/${token}`;

    // const verifyLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: user.email,
      subject: "Verify Email",
      html: `
        <h2>Verify your account</h2>
        <a href="${verifyLink}">
          Verify Email
        </a>
      `,
    });

    return res.json({
      message: "Verification email sent",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
