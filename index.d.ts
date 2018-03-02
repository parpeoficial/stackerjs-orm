import { StackerJS } from "stackerjs-types";


declare module "stackerjs-orm"
{

    export namespace ORM
    {

        export class BaseRepository extends StackerJS.ORM.BaseRepository
        { }

        export class Util extends StackerJS.ORM.Util
        { }

    }

}