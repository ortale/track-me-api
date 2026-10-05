import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const createJourneySchema = z.object({
	name: z.string().trim().min(1).max(200),
	startedAt: z.coerce.date(),
	finishedAt: z.coerce.date(),
	distanceKm: z.number().finite().min(0).default(0),
});

const updateJourneySchema = z
	.object({
		name: z.string().trim().min(1).max(200).optional(),
		startedAt: z.coerce.date().optional(),
		finishedAt: z.coerce.date().optional(),
		distanceKm: z.number().finite().min(0).optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});

const journeyPointSchema = z.object({
	latitude: z.number().finite().min(-90).max(90),
	longitude: z.number().finite().min(-180).max(180),
	recordedAt: z.coerce.date(),
});

const bulkJourneyPointsSchema = z.object({
	points: z.array(journeyPointSchema).min(1),
});

async function findUserId(authUserId: string) {
	const user = await prisma.user.findUnique({
		where: {
			authUserId,
		},
		select: {
			id: true,
		},
	});

	return user?.id;
}

async function journeyBelongsToUser(journeyId: string, authUserId: string) {
	return prisma.journey.findFirst({
		where: {
			id: journeyId,
			user: {
				authUserId,
			},
		},
		select: {
			id: true,
		},
	});
}

export async function listJourneys(req: Request, res: Response) {
	try {
		const authUserId = req.supabaseUser!.id;

		const userId = await findUserId(authUserId);

		if (!userId) {
			return res.json([]);
		}

		const journeys = await prisma.journey.findMany({
			where: {
				userId,
			},
			orderBy: {
				startedAt: "desc",
			},
		});

		return res.json(journeys);
	} catch (error) {
		console.error("List journeys error:", error);

		return res.status(500).json({
			message: "Failed to retrieve journeys",
		});
	}
}

export async function getJourney(req: Request, res: Response) {
	try {
		const authUserId = req.supabaseUser!.id;
		const journeyId = req.params.id as string;

		const journey = await prisma.journey.findFirst({
			where: {
				id: journeyId,
				user: {
					authUserId,
				},
			},
			include: {
				points: {
					orderBy: {
						recordedAt: "asc",
					},
				},
			},
		});

		if (!journey) {
			return res.status(404).json({
				message: "Journey not found",
			});
		}

		return res.json(journey);
	} catch (error) {
		console.error("Get journey error:", error);

		return res.status(500).json({
			message: "Failed to retrieve journey",
		});
	}
}

export async function createJourney(req: Request, res: Response) {
	try {
		const validation = createJourneySchema.safeParse(req.body);

		if (!validation.success) {
			return res.status(400).json({
				message: "Invalid journey data",
				errors: validation.error.flatten().fieldErrors,
			});
		}

		const authUserId = req.supabaseUser!.id;

		const user = await prisma.user.upsert({
			where: {
				authUserId,
			},
			update: {},
			create: {
				authUserId,
				name: null,
			},
			select: {
				id: true,
			},
		});

		const journey = await prisma.journey.create({
			data: {
				userId: user.id,
				name: validation.data.name,
				startedAt: validation.data.startedAt,
				finishedAt: validation.data.finishedAt,
				distanceKm: validation.data.distanceKm,
			},
		});

		return res.status(201).json(journey);
	} catch (error) {
		console.error("Create journey error:", error);

		return res.status(500).json({
			message: "Failed to create journey",
		});
	}
}

export async function updateJourney(req: Request, res: Response) {
	try {
		const validation = updateJourneySchema.safeParse(req.body);

		if (!validation.success) {
			return res.status(400).json({
				message: "Invalid journey data",
				errors: validation.error.flatten().fieldErrors,
			});
		}

		const authUserId = req.supabaseUser!.id;
		const journeyId = req.params.id as string;

		const journey = await journeyBelongsToUser(journeyId, authUserId);

		if (!journey) {
			return res.status(404).json({
				message: "Journey not found",
			});
		}

		const updatedJourney = await prisma.journey.update({
			where: {
				id: journeyId,
			},
			data: validation.data,
		});

		return res.json(updatedJourney);
	} catch (error) {
		console.error("Update journey error:", error);

		return res.status(500).json({
			message: "Failed to update journey",
		});
	}
}

export async function deleteJourney(req: Request, res: Response) {
	try {
		const authUserId = req.supabaseUser!.id;
		const journeyId = req.params.id as string;

		const journey = await journeyBelongsToUser(journeyId, authUserId);

		if (!journey) {
			return res.status(404).json({
				message: "Journey not found",
			});
		}

		await prisma.journey.delete({
			where: {
				id: journeyId,
			},
		});

		return res.status(204).send();
	} catch (error) {
		console.error("Delete journey error:", error);

		return res.status(500).json({
			message: "Failed to delete journey",
		});
	}
}

export async function listJourneyPoints(req: Request, res: Response) {
	try {
		const authUserId = req.supabaseUser!.id;
		const journeyId = req.params.id as string;

		const journey = await journeyBelongsToUser(journeyId, authUserId);

		if (!journey) {
			return res.status(404).json({
				message: "Journey not found",
			});
		}

		const points = await prisma.journeyPoint.findMany({
			where: {
				journeyId,
			},
			orderBy: {
				recordedAt: "asc",
			},
		});

		return res.json(points);
	} catch (error) {
		console.error("List journey points error:", error);

		return res.status(500).json({
			message: "Failed to retrieve journey points",
		});
	}
}

export async function createJourneyPoint(req: Request, res: Response) {
	try {
		const validation = journeyPointSchema.safeParse(req.body);

		if (!validation.success) {
			return res.status(400).json({
				message: "Invalid journey point",
				errors: validation.error.flatten().fieldErrors,
			});
		}

		const authUserId = req.supabaseUser!.id;
		const journeyId = req.params.id as string;

		const journey = await journeyBelongsToUser(journeyId, authUserId);

		if (!journey) {
			return res.status(404).json({
				message: "Journey not found",
			});
		}

		const point = await prisma.journeyPoint.create({
			data: {
				journeyId,
				...validation.data,
			},
		});

		return res.status(201).json(point);
	} catch (error) {
		console.error("Create journey point error:", error);

		return res.status(500).json({
			message: "Failed to create journey point",
		});
	}
}

export async function createJourneyPoints(req: Request, res: Response) {
	try {
		const validation = bulkJourneyPointsSchema.safeParse(req.body);

		if (!validation.success) {
			return res.status(400).json({
				message: "Invalid journey points",
				errors: validation.error.flatten().fieldErrors,
			});
		}

		const authUserId = req.supabaseUser!.id;
		const journeyId = req.params.id as string;

		const journey = await journeyBelongsToUser(journeyId, authUserId);

		if (!journey) {
			return res.status(404).json({
				message: "Journey not found",
			});
		}

		const result = await prisma.journeyPoint.createMany({
			data: validation.data.points.map((point) => ({
				journeyId,
				...point,
			})),
		});

		return res.status(201).json({
			inserted: result.count,
		});
	} catch (error) {
		console.error("Create journey points error:", error);

		return res.status(500).json({
			message: "Failed to create journey points",
		});
	}
}

export async function deleteJourneyPoints(req: Request, res: Response) {
	try {
		const authUserId = req.supabaseUser!.id;
		const journeyId = req.params.id as string;

		const journey = await journeyBelongsToUser(journeyId, authUserId);

		if (!journey) {
			return res.status(404).json({
				message: "Journey not found",
			});
		}

		await prisma.journeyPoint.deleteMany({
			where: {
				journeyId,
			},
		});

		return res.status(204).send();
	} catch (error) {
		console.error("Delete journey points error:", error);

		return res.status(500).json({
			message: "Failed to delete journey points",
		});
	}
}
