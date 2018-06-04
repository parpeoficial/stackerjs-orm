import { BaseService } from "./BaseService";


export class BaseRepositoryHooks extends BaseService 
{

    beforeSave() 
    {
        return Promise.resolve(true);
    }

    afterSave() 
    {
        return Promise.resolve(true);
    }

    beforeValidate() 
    {
        return Promise.resolve(true);
    }

    afterValidate() 
    {
        return Promise.resolve(true);
    }

}