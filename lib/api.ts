import axios from "axios"

export const API = axios.create({
    baseURL: "https://streetly-backend.onrender.com/api",
    withCredentials: true
})