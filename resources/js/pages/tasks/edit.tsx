import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { index } from '@/routes/tasks';

export default function TaskEdit() {
    useEffect(() => {
        router.visit(index.url(), { replace: true });
    }, []);

    return null;
}
