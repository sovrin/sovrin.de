export default defineAppConfig({
    portfolio: {
        name: 'Oleg Kamlowski',
        phrase: 'software development is my passion',
        // Home's h1: the greeting, then the headline, its second half in the yellow.
        greeting: 'Hi, I’m Oleg',
        headline: ['I build', 'small, sharp tools.'],
        about: 'Senior software engineer at Thomann.io. In my own time: a CSS design language, parsers, CLIs and the occasional guitar tab renderer.',
        user: 'sovrin',
        role: 'developer',
        github: 'https://github.com/sovrin',
        linkedin: 'https://www.linkedin.com/in/oleg-kamlowski-2166a224b/',
        mailbox: 'hello',
        // The footer's Score, as its guide on the board says it: what it is,
        // how to play it (add, bend, remove) and what plays along.
        score: {
            lead: 'A melody everyone on this site writes together, one note a step.',
            add: 'Click a step to add a note',
            bend: 'Drag a note up or down for a half step',
            remove: 'Click a note to take it out',
            life: 'A Game of Life plays along, in a new scale every day.',
            keys: 'Or the keys: arrows to move, Enter to add or take out, Shift with up or down to bend',
        },
    },
})
