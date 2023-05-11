const UserModel = require('../models/User');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const resolvers = {
  Mutation: {
    async registerUser(_, { registerInput: { username, email, password } }) {
      console.log("registerInput:", { username, email, password });

      //  see if and older user exists with email attempting to register
      console.log("registerUser");
      const user = await UserModel.findOne({ email });

      // Throw error if that user exists
      if (previousUser) {
        throw new Error(
          "A user with this email already exists" + email,
          "User_Already_Exists"
        );
      }

      // encrypt password
      var encryptedPassword = await bcrypt.hash(password, 10);

      // build out mongoose model(user)
      const newUser = new UserModel({
        username: username,
        email: email.toLowerCase(),
        password: encryptedPassword,
      });

      // create JWT token (attach to out user model) the user model in User.js
      const token = jwt.sign(
        { user_id: newUser._id, email },
        process.env.JWT_SECRET,
        {
          expiresIn: "2h",
        }
      );
      //   attach to user model
      newUser.token = token;
      // Save our user in mongodb
      const res = await newUser.save();
      return {
        id: res.id,
        ...res._doc,
      };
    },
    async loginUser(_, { loginInput: { email, password } }) {
      //    see if user exists with the email

      const user = await UserModel.findOne({ email });
      console.log(user);
      // check if password matches encrypted password
      // create JWT token (attach to out user model) the user model in User.js
      if (user && (await bcrypt.compare(password, user.password))) {
        // create a new JWT token
        console.log("passwords match");
        const token = jwt.sign(
          { user_id: user._id, email },
          process.env.JWT_SECRET,
          {
            expiresIn: "2h",
          }
        );
        // token already exists,
        user.token = token;
        // Save out user in mongodb
        const res = await user;
        return {
          id: res.id,
          ...res._doc,
        };
      } else {
        throw new Error(
          "Invalid login credentials",
          "INVALID_CREDENTIALS"
        );
      }
    },
    async updateUserPreferences(_, { preferences }, context) {
        console.log("Context in updateUserPreferences:", context); // Add this line
        const { user } = context;
      
        if (!user) {
          throw new Error("Authentication required to update user preferences");
        }
      
        try {
          const updatedUser = await UserModel.findByIdAndUpdate(
            user._id,
            { preferences },
            { new: true }
          );
      
          return updatedUser;
        } catch (err) {
          console.log("Error updating user preferences: ", err);
          throw new Error("Error updating user preferences");
        }
      },
      
  },
  //   this is connected to the User.js mongoose model, get user by id
  Query: {
    user: async (_, { ID }) => await UserModel.findById(ID),
    users: async () => await UserModel.find(),
  },
};

module.exports = resolvers;
