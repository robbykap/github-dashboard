# TypeScript Basics for This Project

This guide explains the TypeScript patterns used in the GitHub Dashboard, with examples from the actual codebase.

## What is TypeScript?

TypeScript is JavaScript with **type annotations**. Types help catch errors before you run the code:

```typescript
// JavaScript - error only found at runtime
function greet(name) {
  return "Hello, " + name.toUpperCase();
}
greet(123);  // Runtime error: toUpperCase is not a function

// TypeScript - error caught immediately
function greet(name: string) {
  return "Hello, " + name.toUpperCase();
}
greet(123);  // ❌ Compile error: number is not assignable to string
```

## 1. Basic Types

### Primitive Types

```typescript
const name: string = "Alice";
const age: number = 30;
const isActive: boolean = true;
const data: null = null;
const value: undefined = undefined;
```

### Arrays

```typescript
const numbers: number[] = [1, 2, 3];
const names: string[] = ["Alice", "Bob"];

// Alternative syntax
const items: Array<string> = ["a", "b", "c"];
```

### Objects

```typescript
// Inline object type
const user: { name: string; age: number } = {
  name: "Alice",
  age: 30
};
```

## 2. Interfaces

Interfaces define the **shape** of an object:

```typescript
// Define the shape
interface GitHubIssue {
  id: number;
  title: string;
  body: string;
  state: "open" | "closed";
  labels: string[];
}

// Use the interface
const issue: GitHubIssue = {
  id: 1,
  title: "Fix bug",
  body: "Something is broken",
  state: "open",
  labels: ["bug"]
};
```

### From This Project: `types/ai.ts`

```typescript
// Chat message structure
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Issue preview data
export interface IssuePreviewData {
  title?: string;         // Optional (see below)
  body?: string;
  issue_type?: IssueType | null;
  labels?: string[];
  priority?: Priority | null;
}
```

## 3. Type Aliases

Type aliases create named types (similar to interfaces, but more flexible):

```typescript
// Simple type alias
type IssueType = 'bug' | 'feature' | 'enhancement' | 'documentation' | 'question';

// Use it
const type: IssueType = 'bug';  // ✅ OK
const type: IssueType = 'typo'; // ❌ Error: not a valid IssueType
```

### Interface vs Type

```typescript
// Interface - best for object shapes
interface User {
  name: string;
  email: string;
}

// Type - best for unions, primitives, or complex types
type Status = 'pending' | 'active' | 'completed';
type ID = string | number;
type Callback = (value: string) => void;
```

**Rule of thumb**: Use `interface` for objects, `type` for everything else.

## 4. Optional Properties (`?`)

The `?` makes a property optional:

```typescript
interface Config {
  required: string;    // Must be provided
  optional?: string;   // Can be omitted
}

const config1: Config = { required: "yes" };                    // ✅ OK
const config2: Config = { required: "yes", optional: "maybe" }; // ✅ OK
const config3: Config = {};                                     // ❌ Error: missing required
```

### From This Project

```typescript
// types/ai.ts
export interface IssuePreviewData {
  title?: string;      // Optional - might not be set yet
  body?: string;
  issue_type?: IssueType | null;
  labels?: string[];
  priority?: Priority | null;
}
```

## 5. Union Types (`|`)

Union types allow multiple types:

```typescript
// Value can be string OR number
type ID = string | number;

const id1: ID = "abc123";  // ✅ OK
const id2: ID = 42;        // ✅ OK

// String literal union (specific values only)
type Status = 'pending' | 'active' | 'completed';

const status: Status = 'active';  // ✅ OK
const status: Status = 'unknown'; // ❌ Error
```

### From This Project

```typescript
// types/ai.ts
export type FlowState =
  | 'chatting'       // In conversation
  | 'preview'        // Showing preview
  | 'editing_fields' // Configuring project fields
  | 'creating'       // Creating the issue
  | 'completed';     // Issue created successfully
```

## 6. Generic Types (`<T>`)

Generics are "type variables" - placeholders for types:

```typescript
// A function that works with ANY type
function first<T>(items: T[]): T | undefined {
  return items[0];
}

// TypeScript infers the type
const num = first([1, 2, 3]);      // num is number | undefined
const str = first(["a", "b"]);    // str is string | undefined
```

### Common Generic Patterns

```typescript
// Array of specific type
const items: Array<GitHubIssue> = [];

// Promise that resolves to specific type
async function fetchUser(): Promise<User> {
  return await fetch('/api/user').then(r => r.json());
}

// Record (object with known key/value types)
const cache: Record<string, number> = {};
cache['key1'] = 100;
cache['key2'] = 200;
```

### From This Project

```typescript
// hooks/useCreateIssueFlow.ts
const [fieldValues, setFieldValues] = useState<Record<string, string | number>>({});
// fieldValues is an object where:
// - Keys are strings (field IDs)
// - Values are strings or numbers
```

## 7. Type Imports

Use `import type` when you only need the type (not the value):

```typescript
// Value import - includes in JavaScript bundle
import { auth } from '@/lib/auth';

// Type-only import - removed at compile time, smaller bundle
import type { GitHubIssue } from '@/types/github';
import type { ChatMessage, IssuePreviewData } from '@/types/ai';
```

### From This Project

```typescript
// services/ai-service.ts
import type {
  ChatMessage,
  IssuePreviewData,
  ChatIssueResponse,
  SummarizeIssueResponse,
} from '@/types/ai';
```

## 8. Module Augmentation

Sometimes you need to add properties to types from external libraries:

```typescript
// lib/auth.ts - Adding custom fields to NextAuth types

// "Augment" the next-auth module
declare module 'next-auth' {
  // Extend the Session interface
  interface Session {
    accessToken?: string;      // We add this
    openaiApiKey?: string;     // And this
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      login?: string;          // And this
    };
  }
}

// Now session.accessToken is recognized by TypeScript
```

### Why Module Augmentation?

NextAuth's default `Session` type doesn't include `accessToken`. We store it there in our callbacks, so we need to tell TypeScript about it. Module augmentation "extends" the library's types with our additions.

## 9. Function Types

### Function Parameters and Returns

```typescript
// Named function with types
function add(a: number, b: number): number {
  return a + b;
}

// Arrow function with types
const multiply = (a: number, b: number): number => {
  return a * b;
};

// Function type alias
type MathOperation = (a: number, b: number) => number;
const divide: MathOperation = (a, b) => a / b;
```

### Async Functions

```typescript
// Async function returns Promise<ReturnType>
async function fetchIssues(): Promise<GitHubIssue[]> {
  const response = await fetch('/api/issues');
  return response.json();
}
```

### From This Project

```typescript
// services/ai-service.ts
export async function summarizeIssue(
  title: string,
  body: string,
  apiKey: string
): Promise<SummarizeIssueResponse> {
  // ...
}
```

## 10. Common Type Patterns

### Nullable Types

```typescript
// Value can be the type OR null
type MaybeString = string | null;

// Check before using
function process(value: MaybeString) {
  if (value !== null) {
    console.log(value.toUpperCase());  // ✅ Safe
  }
}
```

### Optional Chaining (`?.`)

```typescript
// Instead of: user && user.profile && user.profile.name
const name = user?.profile?.name;  // Returns undefined if any part is null/undefined
```

### Nullish Coalescing (`??`)

```typescript
// Use default if value is null/undefined (but NOT for empty string or 0)
const name = user.name ?? 'Anonymous';
```

### Non-Null Assertion (`!`)

```typescript
// Tell TypeScript "trust me, this won't be null"
// Use sparingly - only when you're certain
const element = document.getElementById('app')!;
```

### Type Assertion (`as`)

```typescript
// Tell TypeScript to treat value as specific type
const data = response.data as GitHubIssue[];

// More explicit form
const data = <GitHubIssue[]>response.data;
```

## Quick Reference: Types in This Project

### `types/ai.ts`

```typescript
// Issue types (what kind of issue)
type IssueType = 'bug' | 'feature' | 'enhancement' | 'documentation' | 'question';

// Priority levels
type Priority = 'low' | 'medium' | 'high' | 'critical';

// Chat message (conversation history)
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Issue preview (live updating form)
interface IssuePreviewData {
  title?: string;
  body?: string;
  issue_type?: IssueType | null;
  labels?: string[];
  priority?: Priority | null;
}

// Flow states (state machine)
type FlowState = 'chatting' | 'preview' | 'editing_fields' | 'creating' | 'completed';
```

### `types/github.ts`

```typescript
// Repository info
interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  // ...
}

// Issue info
interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  // ...
}
```

## Debugging Type Errors

### "Type X is not assignable to type Y"

```typescript
// Error: Type 'string' is not assignable to type 'number'
const count: number = "5";  // ❌

// Fix: Use correct type
const count: number = 5;    // ✅
// Or: Convert the value
const count: number = parseInt("5");  // ✅
```

### "Property X does not exist on type Y"

```typescript
// Error: Property 'login' does not exist on type 'User'
interface User { name: string; }
const user: User = { name: "Alice" };
console.log(user.login);  // ❌

// Fix: Add property to interface
interface User { name: string; login?: string; }  // ✅
```

### "Object is possibly undefined"

```typescript
// Error: Object is possibly 'undefined'
const items: string[] | undefined = getData();
console.log(items.length);  // ❌

// Fix: Check first
if (items) {
  console.log(items.length);  // ✅
}
// Or: Use optional chaining
console.log(items?.length);  // ✅ (returns undefined if items is undefined)
```
