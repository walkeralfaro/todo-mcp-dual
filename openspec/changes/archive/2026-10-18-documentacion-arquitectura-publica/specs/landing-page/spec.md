# Spec Delta

## ADDED Requirements

### Requirement: Enlace a la documentación de arquitectura en la landing

La landing SHALL ofrecer un enlace visible a la documentación de arquitectura (`/arquitectura`) para visitantes anónimos y con sesión, alcanzable a 390, 768 y 1440 px. El enlace SHALL ser secundario: no SHALL contarse como llamada a la acción principal ni SHALL añadir una segunda acción primaria por pantalla, y SHALL abrirse en una pestaña nueva.

#### Scenario: Visitante anónimo encuentra la documentación

- **WHEN** un visitante sin sesión recorre la landing a 390, 768 o 1440 px
- **THEN** encuentra un enlace visible a `/arquitectura` y al activarlo se abre la documentación en una pestaña nueva

#### Scenario: La jerarquía de acciones se conserva

- **WHEN** se revisa la primera pantalla de la landing
- **THEN** sigue existiendo una sola acción principal de acceso y el enlace a la documentación no compite con ella

#### Scenario: Sin desbordes al añadir el enlace

- **WHEN** la landing se abre a 390, 768 y 1440 px con el enlace publicado
- **THEN** no aparece scroll horizontal ni ningún contenido relevante queda recortado
