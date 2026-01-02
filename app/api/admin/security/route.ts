
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const packageJsonPath = path.join(process.cwd(), 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
            return NextResponse.json({ error: "package.json not found" }, { status: 500 });
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};

        const allDeps = { ...dependencies, ...devDependencies };

        const depList = Object.entries(allDeps).map(([name, version]) => ({
            name,
            version: (version as string).replace('^', '').replace('~', ''), // clean version
            type: dependencies[name] ? 'dependency' : 'devDependency'
        }));

        return NextResponse.json({
            appVersion: packageJson.version,
            dependencies: depList
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
