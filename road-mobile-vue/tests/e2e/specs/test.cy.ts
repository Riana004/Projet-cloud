describe('My First Test', () => {
  it('Visits the app root url and shows login page', () => {
    cy.visit('/')
    // Root redirects to /login; check for the login title
    cy.contains('ion-title', 'Connexion')
  })
})
