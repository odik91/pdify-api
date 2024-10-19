import { isValidObjectId } from "mongoose";
import * as yup from "yup";
import { categories } from "./audio_category";

export const CreateUserSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required("Name is missing!")
    .min(3, "Name is to shoort!")
    .max(20, "Name is too long!"),
  email: yup.string().required("Email is missing").email("Invalid email"),
  password: yup
    .string()
    .trim()
    .required("Password is missing!")
    .min(8, "Password is too short!")
    .matches(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/,
      "Password is too simple!"
    ),
});

export const TokenAndIDValidation = yup.object().shape({
  token: yup.string().trim().required("Invalid token!"),
  userId: yup
    .string()
    .transform(function (value) {
      if (this.isType(value) && isValidObjectId(value)) {
        return value;
      }
      return "";
    })
    .required("Invalid userId!"),
});

export const UpdatePasswordSchema = yup.object().shape({
  token: yup.string().trim().required("Invalid token!"),
  userId: yup
    .string()
    .transform(function (value) {
      if (this.isType(value) && isValidObjectId(value)) {
        return value;
      }
      return "";
    })
    .required("Invalid userId!"),
  password: yup
    .string()
    .trim()
    .required("Password is missing!")
    .min(8, "Password is too short!")
    .matches(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/,
      "Password is too simple!"
    ),
});

export const SignInValidationSchema = yup.object().shape({
  email: yup.string().required("Please provide email!").email("Invalid email!"),
  password: yup.string().trim().required("Please fill the password field!"),
});

export const AudioValidationSchema = yup.object().shape({
  title: yup.string().required("Please provide title!"),
  about: yup.string().required("Please provide about!"),
  category: yup
    .string()
    .oneOf(categories, "Invalid category!")
    .required("Please select a category!"),
});

export const NewPlaylistValidationSchema = yup.object().shape({
  title: yup.string().required("Please provide title!"),
  resId: yup.string().transform(function (value) {
    return this.isType(value) && isValidObjectId(value) ? value : "";
  }),
  visibility: yup
    .string()
    .oneOf(["public", "private"], "Invalid visibility!")
    .required("Please select a visibility!"),
});

export const OldPlaylistValidationSchema = yup.object().shape({
  title: yup.string().required("Please provide title!"),
  // this is to validate the audio id
  item: yup.string().transform(function (value) {
    return this.isType(value) && isValidObjectId(value) ? value : "";
  }),
  // this is to validate the playlist id
  id: yup.string().transform(function (value) {
    return this.isType(value) && isValidObjectId(value) ? value : "";
  }),
  visibility: yup
    .string()
    .oneOf(["public", "private"], "Invalid visibility!")
    .required("Please select a visibility!"),
});
