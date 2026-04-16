import { buildTutorProfileHref } from "./content.js";

function normalizeTutorCard(tutor) {
    return {
        ...tutor,
        profileUrl: buildTutorProfileHref(tutor.id),
        statusBadges: Array.isArray(tutor.statusBadges) ? tutor.statusBadges : [],
        tags: Array.isArray(tutor.tags) ? tutor.tags : [],
    };
}

function normalizePortalPost(post) {
    return {
        ...post,
        avatarTone: post?.avatarTone || "slate",
        checklist: Array.isArray(post?.checklist) ? post.checklist : [],
        initials: post?.initials || "T",
        paragraphs: Array.isArray(post?.paragraphs) ? post.paragraphs : [],
        tags: Array.isArray(post?.tags) ? post.tags : [],
        title: post?.title || "",
    };
}

function normalizeObservedTutor(observation) {
    return {
        ...observation,
        author: observation?.author || "",
        avatarTone: observation?.avatarTone || "slate",
        followersCount: typeof observation?.followersCount === "number" ? observation.followersCount : 0,
        followersLabel: observation?.followersLabel || "0",
        initials: observation?.initials || "T",
        postsCount: typeof observation?.postsCount === "number" ? observation.postsCount : 0,
        profileUrl: buildTutorProfileHref(observation?.id),
    };
}

function shouldRedirectToDatabaseError(response) {
    return response.status >= 500 && response.headers.get("X-Database-Error") === "1";
}

async function parseErrorMessage(response) {
    try {
        const payload = await response.json();
        if (payload?.detail) {
            return payload.detail;
        }
        if (payload?.error) {
            return payload.error;
        }
    } catch (error) {
        // ignore parsing failure and use default message
    }

    return "Nie udalo sie pobrac danych z serwera.";
}

async function parseWriteErrorMessage(response) {
    try {
        const payload = await response.json();
        if (payload?.detail) {
            return payload.detail;
        }
        if (payload?.error) {
            return payload.error;
        }
    } catch (error) {
        // ignore parsing failure and use default message
    }

    return "Nie udalo sie zapisac danych.";
}

export async function fetchTutorSearchResults({ filters, date, searchUrl, databaseErrorUrl = "/database-error" }) {
    const query = new URLSearchParams({
        subject: filters.subject,
        topic: filters.topic,
        level: filters.level,
        hour: filters.hour,
        date,
    });

    const response = await fetch(`${searchUrl}?${query.toString()}`);
    if (shouldRedirectToDatabaseError(response)) {
        window.location.assign(databaseErrorUrl);
        throw new Error("Blad bazy danych.");
    }

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }

    const payload = await response.json();
    return {
        exactMatches: (payload.exactMatches ?? []).map(normalizeTutorCard),
        suggestedTutors: (payload.suggestedTutors ?? []).map(normalizeTutorCard),
    };
}

export async function fetchTutorProfile({ tutorId, tutorProfileBaseUrl, date, databaseErrorUrl = "/database-error" }) {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    const response = await fetch(`${tutorProfileBaseUrl}/${encodeURIComponent(tutorId)}${query}`);
    if (shouldRedirectToDatabaseError(response)) {
        window.location.assign(databaseErrorUrl);
        throw new Error("Blad bazy danych.");
    }

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }

    return response.json();
}

export async function fetchTutorDashboard({ dashboardUrl, databaseErrorUrl = "/database-error" }) {
    const response = await fetch(dashboardUrl);
    if (shouldRedirectToDatabaseError(response)) {
        window.location.assign(databaseErrorUrl);
        throw new Error("Blad bazy danych.");
    }

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }

    return response.json();
}

export async function fetchPortalPosts({ postsUrl, databaseErrorUrl = "/database-error" }) {
    const response = await fetch(postsUrl);
    if (shouldRedirectToDatabaseError(response)) {
        window.location.assign(databaseErrorUrl);
        throw new Error("Blad bazy danych.");
    }

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }

    const payload = await response.json();
    return (payload.posts ?? []).map(normalizePortalPost);
}

export async function fetchPortalObservations({ observationsUrl, databaseErrorUrl = "/database-error" }) {
    const response = await fetch(observationsUrl);
    if (shouldRedirectToDatabaseError(response)) {
        window.location.assign(databaseErrorUrl);
        throw new Error("Blad bazy danych.");
    }

    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }

    const payload = await response.json();
    return (payload.observations ?? []).map(normalizeObservedTutor);
}

export async function saveTutorOnboardingProfile({
    payload,
    saveUrl,
    csrfToken,
    databaseErrorUrl = "/database-error",
}) {
    const response = await fetch(saveUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(payload),
    });

    if (shouldRedirectToDatabaseError(response)) {
        window.location.assign(databaseErrorUrl);
        throw new Error("Blad bazy danych.");
    }

    if (!response.ok) {
        throw new Error(await parseWriteErrorMessage(response));
    }

    return response.json();
}

export async function createPortalPost({
    payload,
    postsUrl,
    csrfToken,
    databaseErrorUrl = "/database-error",
}) {
    const response = await fetch(postsUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(payload),
    });

    if (shouldRedirectToDatabaseError(response)) {
        window.location.assign(databaseErrorUrl);
        throw new Error("Blad bazy danych.");
    }

    if (!response.ok) {
        throw new Error(await parseWriteErrorMessage(response));
    }

    const responsePayload = await response.json();
    return {
        ...responsePayload,
        post: responsePayload?.post ? normalizePortalPost(responsePayload.post) : null,
    };
}

export async function toggleTutorObservation({
    payload,
    observationsUrl,
    csrfToken,
    databaseErrorUrl = "/database-error",
}) {
    const response = await fetch(observationsUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(payload),
    });

    if (shouldRedirectToDatabaseError(response)) {
        window.location.assign(databaseErrorUrl);
        throw new Error("Blad bazy danych.");
    }

    if (!response.ok) {
        throw new Error(await parseWriteErrorMessage(response));
    }

    const responsePayload = await response.json();
    return {
        ...responsePayload,
        observation: responsePayload?.observation ? normalizeObservedTutor(responsePayload.observation) : null,
    };
}

export async function createTutorBookingRequest({
    payload,
    bookingUrl,
    csrfToken,
    databaseErrorUrl = "/database-error",
}) {
    const response = await fetch(bookingUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(payload),
    });

    if (shouldRedirectToDatabaseError(response)) {
        window.location.assign(databaseErrorUrl);
        throw new Error("Blad bazy danych.");
    }

    if (!response.ok) {
        throw new Error(await parseWriteErrorMessage(response));
    }

    return response.json();
}

