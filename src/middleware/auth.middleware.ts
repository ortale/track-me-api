import { NextFunction, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
		detectSessionInUrl: false,
	},
});

declare global {
	namespace Express {
		interface Request {
			supabaseUser?: {
				id: string;
				email?: string;
			};
		}
	}
}

export async function requireAuth(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const authorization = req.headers.authorization;

		if (!authorization?.startsWith("Bearer ")) {
			return res.status(401).json({
				message: "Missing authorization token",
			});
		}

		const token = authorization.substring("Bearer ".length).trim();

		if (!token) {
			return res.status(401).json({
				message: "Missing authorization token",
			});
		}

		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token);

		if (error || !user) {
			return res.status(401).json({
				message: "Invalid or expired authorization token",
			});
		}

		req.supabaseUser = {
			id: user.id,
			email: user.email,
		};

		return next();
	} catch (error) {
		console.error("Authentication error:", error);

		return res.status(401).json({
			message: "Authentication failed",
		});
	}
}
