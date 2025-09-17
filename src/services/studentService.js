import profileServiceDefault from "./studentService/profileService";

// Re-export student services implemented under `studentService/profileService.js`
export * from "./studentService/profileService";

// default export for compatibility
export default profileServiceDefault;
