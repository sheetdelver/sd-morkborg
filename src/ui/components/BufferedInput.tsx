import type { FocusEvent, InputHTMLAttributes } from 'react';

/** Keep a field draft while native writes/realtime source refresh are asynchronous.
 * Commit only the changed field on blur; a new source value retires its old draft. */
export function BufferedInput({ value, onCommit, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'defaultValue'> & {
    value?: string | number; onCommit: (event: FocusEvent<HTMLInputElement>) => void;
}) {
    return <input {...props} key={String(value)} defaultValue={value ?? ''} onBlur={event => {
        if (event.currentTarget.value !== event.currentTarget.defaultValue) onCommit(event);
    }} />;
}
