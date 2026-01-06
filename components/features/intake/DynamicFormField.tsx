"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { FormField } from "@/lib/types/form-builder.types"
import { cn } from "@/lib/utils"

interface DynamicFormFieldProps {
  field: FormField
  value: any
  onChange: (value: any) => void
  readOnly?: boolean
  error?: string
}

export function DynamicFormField({
  field,
  value,
  onChange,
  readOnly = false,
  error,
}: DynamicFormFieldProps) {
  const widthClass = {
    full: "w-full",
    half: "w-full md:w-1/2",
    third: "w-full md:w-1/3",
    quarter: "w-full md:w-1/4",
  }[field.width || "full"]

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "tel":
        return (
          <Input
            id={field.id}
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={field.disabled || readOnly}
            readOnly={field.readonly}
            className={error ? "border-destructive" : ""}
          />
        )

      case "number":
      case "range":
        return (
          <Input
            id={field.id}
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) =>
              onChange(field.type === "number" ? Number(e.target.value) : e.target.value)
            }
            min={field.min}
            max={field.max}
            step={field.step}
            required={field.required}
            disabled={field.disabled || readOnly}
            readOnly={field.readonly}
            className={error ? "border-destructive" : ""}
          />
        )

      case "date":
      case "datetime":
      case "time":
        return (
          <Input
            id={field.id}
            type={field.type}
            name={field.name}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={field.disabled || readOnly}
            readOnly={field.readonly}
            className={error ? "border-destructive" : ""}
          />
        )

      case "textarea":
        return (
          <Textarea
            id={field.id}
            name={field.name}
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={field.rows || 4}
            required={field.required}
            disabled={field.disabled || readOnly}
            readOnly={field.readonly}
            className={error ? "border-destructive" : ""}
          />
        )

      case "select":
        return (
          <Select
            value={value || ""}
            onValueChange={onChange}
            disabled={field.disabled || readOnly}
            required={field.required}
          >
            <SelectTrigger className={error ? "border-destructive" : ""}>
              <SelectValue placeholder={field.placeholder || "선택하세요"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "multiselect":
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option.value}`}
                  checked={selectedValues.includes(String(option.value))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, String(option.value)])
                    } else {
                      onChange(
                        selectedValues.filter((v) => v !== String(option.value))
                      )
                    }
                  }}
                  disabled={field.disabled || readOnly}
                />
                <Label
                  htmlFor={`${field.id}-${option.value}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        )

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value === true || value === "true"}
              onCheckedChange={(checked) => onChange(checked === true)}
              disabled={field.disabled || readOnly}
              required={field.required}
            />
            <Label htmlFor={field.id} className="cursor-pointer text-sm font-normal">
              {field.label}
            </Label>
          </div>
        )

      case "radio":
        return (
          <RadioGroup
            value={value || ""}
            onValueChange={onChange}
            disabled={field.disabled || readOnly}
            required={field.required}
          >
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={String(option.value)}
                  id={`${field.id}-${option.value}`}
                />
                <Label
                  htmlFor={`${field.id}-${option.value}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "boolean":
        return (
          <Select
            value={value === true || value === "true" ? "true" : "false"}
            onValueChange={(val) => onChange(val === "true")}
            disabled={field.disabled || readOnly}
            required={field.required}
          >
            <SelectTrigger className={error ? "border-destructive" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">예</SelectItem>
              <SelectItem value="false">아니오</SelectItem>
            </SelectContent>
          </Select>
        )

      case "file":
      case "image":
        return (
          <Input
            id={field.id}
            type="file"
            name={field.name}
            accept={field.accept}
            multiple={field.multiple}
            onChange={(e) => {
              const files = e.target.files
              if (files) {
                onChange(field.multiple ? Array.from(files) : files[0])
              }
            }}
            required={field.required}
            disabled={field.disabled || readOnly}
            className={error ? "border-destructive" : ""}
          />
        )

      case "color":
        return (
          <Input
            id={field.id}
            type="color"
            name={field.name}
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={field.disabled || readOnly}
            className={cn("h-12", error ? "border-destructive" : "")}
          />
        )

      default:
        return (
          <Input
            id={field.id}
            type="text"
            name={field.name}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={field.disabled || readOnly}
            className={error ? "border-destructive" : ""}
          />
        )
    }
  }

  return (
    <div className={cn("space-y-2", widthClass)}>
      {field.type !== "checkbox" && (
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      {renderField()}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
