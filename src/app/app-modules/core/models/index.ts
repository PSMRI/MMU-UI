/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Core Data Models and Interfaces
 */

export interface LoginRequest {
  userName: string;
  password: string;
  doLogout: boolean;
  withCredentials: boolean;
  captchaToken?: string;
}

export interface LoginResponse {
  statusCode: number;
  data: {
    userID: number;
    userName: string;
    providerID: number;
    isPasswordExpired: boolean;
    accessibility: string;
  };
  messages?: string[];
}

export interface User {
  userID: number;
  userName: string;
  providerID: number;
  isPasswordExpired: boolean;
  accessibility: string;
}

export interface SecurityQuestion {
  questionID: number;
  question: string;
}

export interface SecurityQuestionAnswer {
  questionID: number;
  answer: string;
}

export interface Beneficiary {
  beneficiaryID: number;
  beneficiaryRegID: number;
  firstName: string;
  lastName: string;
  genderID: number;
  genderName: string;
  dateOfBirth: string;
  statusID: number;
  statusName: string;
  aadharNumber?: string;
  phoneNo?: string;
  emailID?: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  messages?: string[];
}

export interface HttpError {
  statusCode: number;
  status?: number;
  error?: {
    message?: string;
  };
  message?: string;
}
