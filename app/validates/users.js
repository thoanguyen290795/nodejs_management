const { check } = require('express-validator');
validator = 
    [check('name').not().isEmpty().trim().withMessage('Not empty'), 
    check('ordering').isInt({gt:0}).withMessage('Must be number'),
    check('status').custom((value , { req }) => {
                  if (value === 'novalue') {
                      throw new Error('Status Not Be Emptied');
                  }
                  return true;
              }),
    check('group_id').custom((value , { req }) => {
                if (value === 'undefined') {
                    throw new Error('Group Not Be Emptied');
                }
                return true;
                        
            }),
    check('content').isLength({max: 200 }),
    
]
module.exports = {
    validator
}
