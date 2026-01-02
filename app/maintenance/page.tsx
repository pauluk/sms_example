import { Wrench } from "lucide-react";

export default function MaintenancePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 text-gray-900">
            <div className="text-center space-y-4 max-w-lg">
                <div className="mx-auto bg-white p-4 rounded-full shadow-md w-fit">
                    <Wrench className="h-12 w-12 text-blue-600" />
                </div>
                <h1 className="text-4xl font-bold">Maintenance in Progress</h1>
                <p className="text-lg text-gray-600">
                    Fin Ops SMS Application is currently undergoing scheduled maintenance.
                    We should be back shortly. Thank you for your patience.
                </p>
                <div className="pt-8">
                    <a href="/" className="text-sm text-blue-600 hover:underline">
                        Admin Login
                    </a>
                </div>
            </div>
        </div>
    );
}
