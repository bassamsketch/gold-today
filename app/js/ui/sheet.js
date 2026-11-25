/** Open a <dialog> as a bottom sheet; resolves with its returnValue ('' when dismissed) once it closes. */
export function openSheet(dialog) {
  return new Promise((resolve) => {
    dialog.returnValue = '';
    const onClose = () => {
      dialog.removeEventListener('close', onClose);
      resolve(dialog.returnValue);
    };
    dialog.addEventListener('close', onClose);
    dialog.showModal();
  });
}

/** Close a sheet when its backdrop is tapped. */
export function closeOnBackdrop(dialog) {
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close('');
  });
}
