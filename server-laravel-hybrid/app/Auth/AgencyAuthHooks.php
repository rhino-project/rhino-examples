<?php

namespace App\Auth;

use Rhino\Contracts\AbstractAuthLifecycleHooks;
use Illuminate\Support\Facades\Log;

/**
 * Lifecycle hooks for the `agency` route group (GROUP_AUTH_DESIGN §7).
 *
 * Runs AFTER each successful auth action on the agency sign-in. This demo logs a
 * tag so the agency vs vendor sign-ins are observably distinct; a real app might
 * audit, attach agency-specific claims, or reject suspended agencies.
 */
class AgencyAuthHooks extends AbstractAuthLifecycleHooks
{
    public function afterLogin($user, array $context): void
    {
        Log::info('[agency] login', [
            'user_id' => $user->getKey(),
            'route_group' => $context['routeGroup'] ?? null,
            'organization' => optional($context['organization'] ?? null)->slug,
        ]);
    }
}
