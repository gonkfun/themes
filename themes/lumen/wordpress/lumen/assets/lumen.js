(() => {
    const key = 'gonk-lumen-appearance';
    const root = document.documentElement;
    const choices = ['system', 'light', 'dark'];
    let current = 'system';

    try {
        const saved = localStorage.getItem(key);
        if (choices.includes(saved)) current = saved;
    } catch {
        // The preference still works for this page when storage is unavailable.
    }

    function apply(value) {
        if (!choices.includes(value)) return;
        current = value;
        if (value === 'system') {
            root.removeAttribute('data-lumen-mode');
        } else {
            root.setAttribute('data-lumen-mode', value);
        }
    }

    apply(current);

    function connectControls() {
        const controls = document.querySelectorAll('select[data-lumen-appearance]');
        controls.forEach(control => {
            control.value = current;
            control.closest('.lm-appearance').hidden = false;
            control.addEventListener('change', () => {
                apply(control.value);
                controls.forEach(other => { other.value = current; });
                try {
                    localStorage.setItem(key, current);
                } catch {
                    // The current page does not require storage.
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', connectControls, { once: true });
    } else {
        connectControls();
    }
})();
