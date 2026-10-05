import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const updateProfileSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(100),
});

export async function getProfile(req: Request, res: Response) {
	try {
		const authUserId = req.supabaseUser!.id;

		const user = await prisma.user.upsert({
			where: {
				authUserId,
			},
			update: {},
			create: {
				authUserId,
			},
		});

		return res.json({
			id: user.id,
			name: user.name,
			email: req.supabaseUser!.email,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		});
	} catch (error) {
		console.error("Get profile error:", error);

		return res.status(500).json({
			message: "Failed to retrieve profile",
		});
	}
}

export async function updateProfile(req: Request, res: Response) {
	try {
		const validation = updateProfileSchema.safeParse(req.body);

		if (!validation.success) {
			return res.status(400).json({
				message: "Invalid profile data",
				errors: validation.error.flatten().fieldErrors,
			});
		}

		const authUserId = req.supabaseUser!.id;
		const { name } = validation.data;

		const user = await prisma.user.upsert({
			where: {
				authUserId,
			},
			update: {
				name,
			},
			create: {
				authUserId,
				name,
			},
		});

		return res.json({
			id: user.id,
			name: user.name,
			email: req.supabaseUser!.email,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		});
	} catch (error) {
		console.error("Update profile error:", error);

		return res.status(500).json({
			message: "Failed to update profile",
		});
	}
}
