import { Injectable, Logger } from '@nestjs/common';
import { ISubject, IObserver } from '../../../messages/domain/observer/interfaces';
import { EventoUniversidadEvent } from './evento-universidad-event.interface';

/**
 * CA1: Subject del patrón Observer para eventos universitarios.
 * Implementa ISubject<EventoUniversidadEvent> y emite NUEVO_EVENTO
 * con la categoría como campo del payload.
 */
@Injectable()
export class EventoUniversidadSubject implements ISubject<EventoUniversidadEvent> {
  private readonly observers: IObserver<EventoUniversidadEvent>[] = [];
  private readonly logger = new Logger(EventoUniversidadSubject.name);

  attach(observer: IObserver<EventoUniversidadEvent>): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
      this.logger.log(`Observer adjuntado. Total: ${this.observers.length}`);
    }
  }

  detach(observer: IObserver<EventoUniversidadEvent>): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
      this.logger.log(`Observer removido. Total: ${this.observers.length}`);
    }
  }

  /**
   * Notifica a todos los observers del nuevo evento universitario.
   * CA1: emite NUEVO_EVENTO con la categoría en el payload.
   */
  notify(event: EventoUniversidadEvent): void {
    this.logger.log(
      `Notificando ${this.observers.length} observer(s) — NUEVO_EVENTO en "${event.categoria}"`,
    );
    for (const observer of this.observers) {
      try {
        observer.update(event);
      } catch (error) {
        this.logger.error(`Fallo al notificar observer: ${error.message}`, error.stack);
      }
    }
  }

  getObserverCount(): number {
    return this.observers.length;
  }
}
