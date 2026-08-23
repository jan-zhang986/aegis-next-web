/**
 * 用例步骤编辑器
 * 从 aegis-next-server addStep.vue 迁移
 */

import { Plus, Copy, Trash2, MoreVertical, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { StepListItem } from '../types';
import { generateId } from '../utils';
import { cn } from '@/utils/cn';

interface StepEditorProps {
  steps: StepListItem[];
  onChange: (steps: StepListItem[]) => void;
  disabled?: boolean;
}

interface SortableRowProps {
  item: StepListItem;
  index: number;
  stepsLength: number;
  disabled?: boolean;
  updateStep: (index: number, field: 'step' | 'expected', value: string) => void;
  copyStep: (index: number) => void;
  insertBefore: (index: number) => void;
  insertAfter: (index: number) => void;
  removeStep: (index: number) => void;
}

function SortableRow({
  item,
  index,
  stepsLength,
  disabled,
  updateStep,
  copyStep,
  insertBefore,
  insertAfter,
  removeStep,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "bg-accent/50 shadow-md opacity-80")}
    >
      <TableCell className="align-top pt-3">
        <div className="flex items-center gap-2">
          {!disabled && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 shrink-0">
            {index + 1}
          </div>
        </div>
      </TableCell>
      <TableCell className="align-top p-2">
        <Textarea
          value={item.step}
          onChange={(e) => updateStep(index, 'step', e.target.value)}
          placeholder="请输入步骤描述"
          className="min-h-[60px] resize-y"
          maxLength={1000}
          disabled={disabled}
        />
      </TableCell>
      <TableCell className="align-top p-2">
        <Textarea
          value={item.expected}
          onChange={(e) => updateStep(index, 'expected', e.target.value)}
          placeholder="请输入预期结果"
          className="min-h-[60px] resize-y"
          maxLength={1000}
          disabled={disabled}
        />
      </TableCell>
      {!disabled && (
        <TableCell className="align-top p-2 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => copyStep(index)}>
                <Copy className="mr-2 h-4 w-4" /> 复制步骤
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertBefore(index)}>
                在上方插入
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertAfter(index)}>
                在下方插入
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => removeStep(index)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> 删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
    </TableRow>
  );
}

export function StepEditor({ steps, onChange, disabled }: StepEditorProps) {
  const addStep = () => {
    onChange([
      ...steps,
      { id: generateId(), step: '', expected: '' },
    ]);
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  const copyStep = (index: number) => {
    const item = steps[index];
    const newItem = { ...item, id: generateId() };
    const next = [...steps];
    next.splice(index + 1, 0, newItem);
    onChange(next);
  };

  const insertBefore = (index: number) => {
    const newItem: StepListItem = { id: generateId(), step: '', expected: '' };
    const next = [...steps];
    next.splice(index, 0, newItem);
    onChange(next);
  };

  const insertAfter = (index: number) => {
    const newItem: StepListItem = { id: generateId(), step: '', expected: '' };
    const next = [...steps];
    next.splice(index + 1, 0, newItem);
    onChange(next);
  };

  const updateStep = (index: number, field: 'step' | 'expected', value: string) => {
    const next = steps.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    onChange(next);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((item) => item.id === active.id);
      const newIndex = steps.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(steps, oldIndex, newIndex));
      }
    }
  };

  return (
    <div className="mb-5 w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">序号</TableHead>
              <TableHead className="min-w-[200px]">用例步骤</TableHead>
              <TableHead className="min-w-[200px]">预期结果</TableHead>
              {!disabled && <TableHead className="w-[80px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={steps.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {steps.map((item, index) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  index={index}
                  stepsLength={steps.length}
                  disabled={disabled}
                  updateStep={updateStep}
                  copyStep={copyStep}
                  insertBefore={insertBefore}
                  insertAfter={insertAfter}
                  removeStep={removeStep}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>
      {!disabled && (
        <Button variant="ghost" size="sm" className="mt-2 px-0" onClick={addStep}>
          <Plus className="mr-1 h-4 w-4" /> 添加步骤
        </Button>
      )}
    </div>
  );
}
