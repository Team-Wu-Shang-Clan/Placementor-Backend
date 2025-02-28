import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ApiError } from '../utils/api-error';
import { generateToken } from '../utils/jwt';

const prisma = new PrismaClient();

const registerUser = async ({
    email,
    password,
    firstName,
    lastName,
}: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}): Promise<{ user: User }> => {
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new ApiError(400, 'Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
        },
    });

    // await emailService.sendVerificationEmail(user.email, verificationToken);

    // const token = generateToken(user);

    return { user };
};

const loginUser = async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken(user);

    return { user, token };
};


export const authService = {
    registerUser,
    loginUser,
};
