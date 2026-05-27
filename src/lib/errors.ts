import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function successResponse(data: unknown, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
    return NextResponse.json({ success: false, error: message }, { status });
}

export function validationErrorResponse(error: ZodError) {
    const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    return NextResponse.json(
        { success: false, error: 'Validation failed', details: messages },
        { status: 400 }
    );
}

export function unauthorizedResponse(message = 'Unauthorized') {
    return errorResponse(message, 401);
}

export function forbiddenResponse(message = 'Forbidden') {
    return errorResponse(message, 403);
}

export function notFoundResponse(message = 'Not found') {
    return errorResponse(message, 404);
}

export function serverErrorResponse(error: unknown) {
    console.error('Server error:', error);
    return errorResponse('Internal server error', 500);
}
