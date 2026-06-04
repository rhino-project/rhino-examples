<?php

namespace App\Auth;

use Rhino\Contracts\AbstractAuthLifecycleHooks;
use Illuminate\Support\Facades\Log;

/**
 * Lifecycle hooks for the `vendor` route group (GROUP_AUTH_DESIGN §7).
 *
 * A DIFFERENT post-auth behavior from the agency sign-in: this demo records a
 * distinct vendor tag. A real app might enforce vendor onboarding state and
 * reject (throw Rhino\Exceptions\RhinoAuthRejected) for not-yet-approved vendors.
 */
class VendorAuthHooks extends AbstractAuthLifecycleHooks
{
    public function afterLogin($user, array $context): void
    {
        Log::info('[vendor] login', [
            'user_id' => $user->getKey(),
            'route_group' => $context['routeGroup'] ?? null,
            'organization' => optional($context['organization'] ?? null)->slug,
        ]);
    }
}
