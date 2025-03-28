const passport = require("passport")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require("../models/userSchema")
const env = require("dotenv").config()


passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // console.log("Google Profile:", profile);
                const email = profile.emails && profile.emails[0] && profile.emails[0].value;

                if (!email) {
                    return done(new Error("No email found in Google profile"), null);
                }

                let user = await User.findOne({ googleId: profile.id });
                console.log("User found in googleid", user)
                if (user) {
                    if (user.isBlocked) {
                        return done(null, false, { message: "Your account is blocked. Contact support." });
                    }
                    return done(null, user);
                } else {
                    user = new User({
                        name: profile.displayName,
                        email: email,
                        googleId: profile.id,
                    });
                    // console.log("New User:", user);
                    await user.save();
                    return done(null, user);
                }
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Using assgin user deatials to session
passport.serializeUser((user,done)=>{
    done(null, user.id)
})

// Using for fetch user data from session
passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then((user)=>{
        done(null, user)
    })
    .catch((error)=>{
        done(error,null)
    })
})

module.exports = passport
