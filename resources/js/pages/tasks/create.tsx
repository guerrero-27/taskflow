import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { index } from '@/routes/tasks';

export default function TaskCreate() {
    useEffect(() => {
        router.visit(index.url(), { replace: true });
    }, []);

    return null;
}
