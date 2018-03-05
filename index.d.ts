import { StackerJS } from "stackerjs-types";


declare module "stackerjs-orm"
{

    export namespace ORM
    {

        export abstract class BaseRepository extends StackerJS.ORM.BaseRepository
        { 

            abstract entity:StackerJS.ORM.IEntity;

        }

        export class Util extends StackerJS.ORM.Util
        { }

        export interface IEntity extends StackerJS.ORM.IEntity
        { }

    }

}