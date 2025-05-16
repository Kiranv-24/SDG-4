import { TextField } from "@mui/material";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { registerUser } from "../../api";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { useNavigate } from "react-router";
import Loading from "../Loading";
import { useTranslation } from "react-i18next";

function Register() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [button, setbutton] = useState(false);
  const [apiError, setApiError] = useState(null);
  const {
    reset,
    register,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    formState: { errors, isSubmitting, isValidating },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      classname: "11",
      phonenumber: "",
    },
  });

  const onSubmit = async (formData) => {
    setbutton(true);
    try {
      const { data } = await registerUser(formData);
      toast.success(data.message, { id: data.message });
      navigate("/login");
      reset();
      setApiError(null);
      setValue("name", "");
      setValue("email", "");
      setValue("picture", null);
    } catch (err) {
      console.log(err);
      setApiError(err.response.data.message);
      setbutton(false);
    }
  };
  return (
    <div className="flex h-screen">
      <div className=" hidden lg:block w-1/2 h-screen bg-blue-400">
        <img
          className="object-cover h-full w-full"
          src="https://newlookschool.com/wp-content/uploads/2021/08/Knolage-and-Learning.jpg"
        />
      </div>
      <div className=" mx-auto ml-auto mt-auto mb-auto  lg:w-1/5 ">
        <div className="flex  mx-auto  flex-col gap-4 h-1/2  ">
         
          <h1 className="font-bold text-3xl font-mono">{t("register_title")}</h1>
          <div>{t("register_existing_user")} <a href="/login" className="text-blue-700 font-bold" >{t("register_login")}</a></div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-5 my-10">
              <div className="">
                <TextField
                  id="outlined-basic"
                  label={t("register_name")}
                  variant="outlined"
                  className="w-full rounded-lg text-white"
                  {...register("name")}
                />
              </div>
              <div className="hidden">
                <TextField
                  id="outlined-basic"
                  label="class"
                  variant="outlined"
                  className="w-full rounded-lg text-white"
                  {...register("classname")}
                />
              </div>
              <div className="">
                <TextField
                  id="outlined-basic"
                  label="phonenumber"
                  variant="outlined"
                  className="w-full rounded-lg text-white"
                  {...register("phonenumber")}
                />
              </div>
              <div className="">
                <TextField
                  id="outlined-basic"
                  label={t("register_email")}
                  variant="outlined"
                  className="w-full rounded-lg text-white"
                  {...register("email")}
                />
              </div>
              <div className="relative">
                <TextField
                  id="outlined-basic"
                  label={t("register_password")}
                  variant="outlined"
                  className={`w-full rounded-lg text-white ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a password"
                  {...register("password")}
                />
                <div
                  className="absolute top-8 right-1 translate-x-[-50%] translate-y-[-50%] hover:cursor-pointer"
                  onClick={() => {
                    setShowPassword((showPassword) => !showPassword);
                  }}
                >
                  {showPassword ? (
                    <AiFillEye size={20} />
                  ) : (
                    <AiFillEyeInvisible size={20} />
                  )}
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm italic">
                    {errors.password.message}
                  </p>
                )}
                {apiError && (
                  <p className="text-red-500 text-sm italic">{apiError}</p>
                )}
              </div>
            </div>
           
          
             {
              isSubmitting ? (
            <div className="bg-blue-500  text-white flex items-center h-16 rounded-lg">
  <span className="text-center ml-2">{t("login_verifying")}</span>
  <Loading />
</div>

              ) : (
                 <button  className="bg-blue-500 p-3 rounded-xl w-full text-white">
                {t("register_button")}
              </button>
              )
             }
            
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
