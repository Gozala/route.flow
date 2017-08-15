/* @flow */

export type Lift<value, mapper> = $PropertyType<
  $ObjMap<{ value: value }, mapper>,
  "value"
>
