import { defineI18nLocale } from "#i18n";

export default defineI18nLocale(() => ({
  app: {
    name: "App",
  },
  layouts: {
    default: {
      title: "App",
      description: "Sample app",
      sidebar: {
        title: "Menu",
        description: "Navigation menu",
        toggle: "Toggle sidebar",
      },
    },
  },
  pages: {
    home: {
      title: "Home",
      description: "Welcome to the home page",
    },
    settings: {
      title: "Application settings",
      description: "Configure application settings",
      general: {
        title: "General settings",
        description: "Adjust general preferences",
        tab: "General",
      },
      users: {
        title: "Users settings",
        description: "Manage users and assign roles",
        tab: "Users",
        table: {
          filter: "Filter",
          search: "Search",
          sort: "Sort",
          username: "Username",
          fullname: "Full name",
          email: "Email",
          roles: "Roles",
          groups: "Groups",
          actions: {
            title: "Actions",
            create: {
              label: "Create",
              success: {
                title: "User created",
                description: "User has been created successfully",
              },
              error: {
                title: "User not created",
                description: "Error while creating user",
              },
            },
            update: {
              label: "Edit",
              success: {
                title: "User updated",
                description: "User has been updated successfully",
              },
              error: {
                title: "User not updated",
                description: "Error while updating user",
              },
            },
            delete: {
              label: "Delete",
              success: {
                title: "User deleted",
                description: "User has been deleted successfully",
              },
              error: {
                title: "User not deleted",
                description: "Error while deleting user",
              },
            },
          },
        },
      },
      groups: {
        title: "Groups settings",
        description: "Manage groups and assign roles",
        tab: "Groups",
        table: {
          filter: "Filter",
          search: "Search",
          sort: "Sort",
          name: "Name",
          description: "Description",
          roles: "Roles",
          actions: {
            title: "Actions",
            create: {
              label: "Create",
              success: {
                title: "Group created",
                description: "Group has been created successfully",
              },
              error: {
                title: "Group not created",
                description: "Error while creating group",
              },
            },
            update: {
              label: "Edit",
              success: {
                title: "Group updated",
                description: "Group has been updated successfully",
              },
              error: {
                title: "Group not updated",
                description: "Error while updating group",
              },
            },
            delete: {
              label: "Delete",
              success: {
                title: "Group deleted",
                description: "Group has been deleted successfully",
              },
              error: {
                title: "Group not deleted",
                description: "Error while deleting group",
              },
            },
          },
        },
      },
    },
    about: {
      title: "About",
      description: "Information about the application",
    },
    error: {
      title: "Error",
      description: "An error occurred",
      back: "Back to home",
      message: {
        400: "Bad request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Page not found",
        405: "Method not allowed",
        410: "No longer available",
        429: "Too many requests",
        500: "Internal server error",
      },
    },
  },
  components: {
    userMenu: {
      anonymous: {
        label: "Anonymous",
      },
      settings: {
        label: "Settings",
      },
      language: {
        label: "Language",
      },
      theme: {
        label: "Theme",
        value: {
          light: "Light",
          dark: "Dark",
        },
      },
      logIn: {
        label: "Log in",
      },
      logOut: {
        label: "Log out",
      },
    },
    users: {
      upsertModal: {
        create: {
          title: "Create user",
          description: "Provide details to add a new user",
        },
        update: {
          title: "Edit user",
          description: "Modify the details of an existing user",
        },
        form: {
          username: {
            label: "Username",
          },
          fullname: {
            label: "Full name",
          },
          email: {
            label: "Email",
          },
          roles: {
            label: "Roles",
          },
          groups: {
            label: "Groups",
          },
          save: {
            label: "Save",
          },
          cancel: {
            label: "Cancel",
          },
        },
      },
      deleteModal: {
        title: "Delete user",
        description: "Confirm the permanent removal of this user",
        form: {
          message: 'Are you sure you want to delete the user "{username}"?',
          delete: {
            label: "Delete",
          },
          cancel: {
            label: "Cancel",
          },
        },
      },
    },
    groups: {
      upsertModal: {
        create: {
          title: "Create group",
          description: "Provide details to add a new group",
        },
        update: {
          title: "Edit group",
          description: "Modify the details of an existing group",
        },
        form: {
          name: {
            label: "Name",
          },
          description: {
            label: "Description",
          },
          roles: {
            label: "Roles",
          },
          save: {
            label: "Save",
          },
          cancel: {
            label: "Cancel",
          },
        },
      },
      deleteModal: {
        title: "Delete group",
        description: "Confirm the permanent removal of this group",
        form: {
          message: 'Are you sure you want to delete the group "{name}"?',
          delete: {
            label: "Delete",
          },
          cancel: {
            label: "Cancel",
          },
        },
      },
    },
  },
}));
