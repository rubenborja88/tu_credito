class PermissionsPolicyMiddleware:
    """Adds a Permissions-Policy header.

    Default policy is permissive; tighten later if needed.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['Permissions-Policy'] = (
            "camera=(), microphone=(), geolocation=(), fullscreen=(self), payment=(), usb=()"
        )
        return response
