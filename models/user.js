const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

var userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
        },
        surname: {
            type: String,
            trim: true,
            required: true,
        },
        email: {
            type: String,
            trim: true,
            required: true,
        },
        telephone: {
            type: String,
        },
        password: {
            type: String,
            trim: true,
        },
        permissions: {
            type: Boolean,
            trim: true,
        },
        account: {
            type: Number,
            trim: true,
        },
        transactionId: [{ type: mongoose.Schema.Types.ObjectId }],
        budgetId: [{ type: mongoose.Schema.Types.ObjectId }],
        notificationId: [{ type: mongoose.Schema.Types.ObjectId }],
        categoryId: [{ type: mongoose.Schema.Types.ObjectId }],
        token: {
            type: String,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", function (next) {
    var user = this;
    if (this.password != null) {
        if (this.isModified("password") || this.isNew) {
            bcrypt.genSalt(10, function (err, salt) {
                if (err) {
                    return next(err);
                }
                bcrypt.hash(user.password, salt, function (err, hash) {
                    if (err) {
                        return next(err);
                    }
                    user.password = hash;
                    next();
                });
            });
        } else {
            return next();
        }
    } else {
        return next();
    }
});

userSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

userSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("User", userSchema);
