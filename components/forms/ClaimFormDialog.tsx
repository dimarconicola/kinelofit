'use client';

import { Button, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from '@heroui/react';

import type { Locale } from '@/lib/catalog/types';
import { ClaimForm } from '@/components/forms/ClaimForm';

export function ClaimFormDialog({ studioSlug, locale }: { studioSlug: string; locale: Locale }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const labels =
    locale === 'it'
      ? {
          trigger: 'Invia richiesta',
          title: 'Suggerisci un aggiornamento',
          body: 'Se gestisci questo studio o vuoi segnalare dati da correggere, usa questo form.'
        }
      : {
          trigger: 'Send request',
          title: 'Suggest an update',
          body: 'Use this form if you run this venue or want to report a catalog correction.'
        };

  return (
    <>
      <Button className="button button-secondary" variant="flat" radius="full" onPress={onOpen}>
        {labels.trigger}
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size="2xl" scrollBehavior="inside">
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="modal-stack">
                <div>
                  <h2 className="modal-title">{labels.title}</h2>
                  <p className="modal-copy">{labels.body}</p>
                </div>
              </ModalHeader>
              <ModalBody>
                <ClaimForm studioSlug={studioSlug} locale={locale} panel={false} />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
