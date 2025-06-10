import type React from "react"
import type { Control, FieldValues } from "react-hook-form"
import { Checkbox } from "./ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Switch } from "./ui/switch"
import { Textarea } from "./ui/textarea"

interface InputProps<T extends FieldValues = FieldValues> {
    type: "input" | "select" | "checkbox" | "switch" | "radio" | "textarea"
    control: Control<T>
    name: Path<T>
    label?: string
    placeholder?: string
    inputType?: "text" | "email" | "password" | "date"
    selectList?: { label: string; value: string }[]
    defaultValue?: string
}

import type { ControllerRenderProps, Path } from "react-hook-form"

const RenderInput = <T extends FieldValues>({
    field,
    props
}: {
    field: ControllerRenderProps<T, Path<T>>
    props: InputProps<T>
}) => {
    switch (props.type) {
        case "input":
            return (
                <FormControl>
                    <Input type={props.inputType} placeholder={props.placeholder} {...field} />
                </FormControl>
            )

        case "select":
            return (
                <Select onValueChange={field.onChange} value={field?.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={props.placeholder} />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {props.selectList?.map((i, id) => (
                            <SelectItem key={id} value={i.value}>
                                {i.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )

        case "checkbox":
            return (
                <div className="items-top flex space-x-2">
                    <Checkbox
                        id={props.name}
                        onCheckedChange={(e) => field.onChange(e === true || null)}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor={props.name}
                            className="cursor-pointer font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {props.label}
                        </label>
                        <p className="text-muted-foreground text-sm">{props.placeholder}</p>
                    </div>
                </div>
            )

        case "radio":
            return (
                <div className="w-full">
                    <FormLabel>{props.label}</FormLabel>
                    <RadioGroup
                        defaultValue={props.defaultValue}
                        onChange={field.onChange}
                        className="flex gap-4"
                    >
                        {props?.selectList?.map((i, id) => (
                            <div className="flex w-full items-center" key={id}>
                                <RadioGroupItem
                                    value={i.value}
                                    id={i.value}
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor={i.value}
                                    className="flex flex-1 items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:text-blue-600"
                                >
                                    {i.label}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            )

        case "textarea":
            return (
                <FormControl>
                    <Textarea placeholder={props.placeholder} {...field} />
                </FormControl>
            )
    }
}
export const CustomInput = <T extends FieldValues>(props: InputProps<T>) => {
    const { name, label, control, type } = props

    return (
        // <div className="w-full pt-6">
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className="w-full">
                    {type !== "radio" && type !== "checkbox" && <FormLabel>{label}</FormLabel>}
                    <RenderInput field={field} props={props} />
                    <FormMessage />
                </FormItem>
            )}
        />
        // </div>
    )
}

type Day = {
    day: string
    start_time?: string
    close_time?: string
}
interface SwitchProps {
    data: { label: string; value: string }[]
    setWorkSchedule: React.Dispatch<React.SetStateAction<Day[]>>
}

export const SwitchInput = ({ data, setWorkSchedule }: SwitchProps) => {
    const handleChange = (
        day: string,
        field: "start_time" | "close_time" | true,
        value: string
    ) => {
        setWorkSchedule((prevDays) => {
            const dayExist = prevDays.find((d) => d.day === day)

            if (dayExist) {
                return prevDays.map((d) => (d.day === day ? { ...d, field: value } : d))
            }
            if (field === true) {
                return [...prevDays, { day, start_time: "09:00", close_time: "17:00" }]
            }
            return [...prevDays, { day, [field]: value }]
        })
    }

    return (
        <div className="">
            {data?.map((el, id) => (
                <div
                    key={id}
                    className="flex w-full items-center space-y-3 border-t border-t-gray-200 py-3"
                >
                    <Switch
                        id={el.value}
                        className="peer data-[state=checked]:bg-blue-600"
                        onCheckedChange={(_e) => handleChange(el.value, true, "09:00")}
                    />
                    <Label htmlFor={el.value} className="w-20 capitalize">
                        {el.value}
                    </Label>

                    <Label className="pl-10 font-normal text-gray-400 italic peer-data-[state=checked]:hidden">
                        Not working on this day
                    </Label>

                    <div className="hidden items-center gap-2 pl-6: peer-data-[state=checked]:flex">
                        <Input
                            name={`${el.label}.start_time`}
                            type="time"
                            defaultValue="09:00"
                            onChange={(e) => handleChange(el.value, "start_time", e.target.value)}
                        />
                        <Input
                            name={`${el.label}.close_time`}
                            type="time"
                            defaultValue="17:00"
                            onChange={(e) => handleChange(el.value, "close_time", e.target.value)}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}
