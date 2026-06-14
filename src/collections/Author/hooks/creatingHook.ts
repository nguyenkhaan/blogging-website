import { CollectionBeforeChangeHook } from "payload";

export const testingHook : CollectionBeforeChangeHook = async ({data , operation ,  req}) => {
    console.log("Data gui len la: " , data) 
    console.log("Thao tac: " , operation) 
    console.log("Request gui len la: " , req) 
    return data //Se tien hanh luu tru du lieu vao databaase 
}