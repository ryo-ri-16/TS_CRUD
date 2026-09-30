import { z } from "zod";
export declare const GENDER_VALUES: readonly ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];
export type Gender = (typeof GENDER_VALUES)[number];
export declare const userSchema: z.ZodObject<{
    name: z.ZodString;
    age: z.ZodNullable<z.ZodNumber>;
    gender: z.ZodEnum<{
        MALE: "MALE";
        FEMALE: "FEMALE";
        OTHER: "OTHER";
        PREFER_NOT_TO_SAY: "PREFER_NOT_TO_SAY";
    }>;
    description: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type UserInput = z.infer<typeof userSchema>;
