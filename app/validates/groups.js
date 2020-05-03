const { check } = require('express-validator');
validator = 
    [check('name').not().isEmpty().trim().withMessage('Not empty'), 
    check('ordering').isNumeric({gt:0}).withMessage('Must be number'),
    check('status').custom((value , { req }) => {
                  if (value === 'novalue') {
                      throw new Error('Status not be emptied');
                  }
                  return true;
              }),
    check('content_ck').isLength({ max: 200 }),
    check('group_acp').notEmpty().withMessage('Choose a value')
]
module.exports = {
    validator
}
